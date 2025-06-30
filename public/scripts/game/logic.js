import {ChzzkClient} from "https://cdn.skypack.dev/chzzk"
import {addMessageBox, clearChatBox, convertColorCode, updateQuiz, updateRankGraph} from "./ui.js";
import {getSessionData, setSessionData} from '../utils.js';

const scores = getSessionData('scoreboard') || {};
const gameState = getSessionData('gameState')
if(!gameState) location.href = 'index.html';

let chzzkChat;
let liveStatus;
const client = new ChzzkClient({
    baseUrls: {
        chzzkBaseUrl: "/cors/chzzk",
        gameBaseUrl: "/cors/game"
    }
});

const $topicTitle = document.getElementById('topic-title');
const $topicDesc = document.getElementById('topic-desc');
const $nextBtn = document.getElementById('next-btn');

$topicTitle.textContent = gameState.quiz.topic;
$topicDesc.textContent = gameState.quiz.description;

$nextBtn.onclick = nextRound;

const checkLiveState = async (channelId) => {
    const beforeLiveStatus = liveStatus;
    try{
        liveStatus = await client.live.status(channelId);
    }catch(e){}
    if(liveStatus == null || typeof liveStatus !== 'object'){
        return;
    }

    if(!!liveStatus.chatChannelId && liveStatus.chatChannelId !== beforeLiveStatus?.chatChannelId){
        if(!!beforeLiveStatus?.chatChannelId){
            clearChatBox();
        }
        connectChannel();
    }
}

const connectChannel = () => {
    if(chzzkChat?.connected){
        chzzkChat.disconnect();
    }

    let startTime = Date.now();
    chzzkChat = client.chat({
        chatChannelId: liveStatus.chatChannelId,
        pollInterval: 0,
    });
    chzzkChat.on('connect', () => {
        startTime = Date.now();
        chzzkChat.requestRecentChat(50)
    })
    chzzkChat.on('chat', chat => {
        const message = chat.message;
        const date = +chat.time || Date.now();

        let colorData;
        const streamingProperty = chat.profile.streamingProperty;
        if(chat.profile.title){ // 스트리머, 매니저 등 특수 역할
            colorData = chat.profile.title.color;
        }else{
            colorData = convertColorCode(
                streamingProperty.nicknameColor.colorCode,
                chat.profile.userIdHash,
                chzzkChat.chatChannelId
            );
        }

        let emojiList = chat.extras?.emojis;
        if(!emojiList || typeof emojiList !== 'object'){
            emojiList = {};
        }

        const badgeList = []
        if(chat.profile?.badge?.imageUrl){
            badgeList.push(chat.profile.badge.imageUrl)
        }
        if(streamingProperty.realTimeDonationRanking?.badge?.imageUrl){
            badgeList.push(streamingProperty.realTimeDonationRanking.badge.imageUrl)
        }
        if(streamingProperty.subscription?.badge?.imageUrl){
            badgeList.push(streamingProperty.subscription.badge.imageUrl)
        }
        for(const viewerBadge of chat.profile.viewerBadges){
            badgeList.push(viewerBadge.badge.imageUrl)
        }
        addMessageBox(chat.profile, message, date, colorData, emojiList, badgeList);

        if(!gameState.solved && startTime <= date && message.trim() === gameState.quiz.items[gameState.round].word){
            onQuizSolved(chat.profile);
        }
    });
    chzzkChat.connect().catch(() => {});
}

const redirectChannel = (channelId) => {
    const url = new URL(location.href);
    url.searchParams.set('channelId', channelId);
    location.href = url.toString();
}

function onQuizSolved(profile){
    gameState.solved = true;
    setSessionData('gameState', gameState)

    $nextBtn.hidden = false;
    scores[profile.userIdHash] ??= {
        profile,
        score: 0
    }
    scores[profile.userIdHash].score += 100;
    setSessionData('scoreboard', scores);
    // TODO: 정답자 및 정답 modal
    // TODO: fanfare effect
    updateRankGraph(scores);
}

function nextRound(){
    ++gameState.round
    gameState.solved = false;
    setSessionData('gameState', gameState);

    if(gameState.round >= gameState.quiz.items.length) return finishGame();
    updateQuiz(gameState)
    updateRankGraph(scores);
}

function finishGame(){
    setSessionData('gameState', gameState);
    location.href = 'result.html';
}

window.addEventListener('load', async () => {
    const params = new URLSearchParams(location.search);
    let channelId = params.get('channelId') || params.get('channel')  || params.get('id');
    if(!channelId){
        while(!channelId){
            channelId = prompt('치지직 채널 ID 혹은 닉네임을 입력해주세요');
        }
        redirectChannel(channelId);
        return;
    }

    let liveDetail;
    try{
        liveDetail = await client.live.detail(channelId);
    }catch(e){}
    if(liveDetail == null || typeof liveDetail !== 'object'){
        const channelList = await client.search.channels(channelId);
        let channel = channelList.channels.find(channel => channel.channelName === channelId);
        if(!channel){
            channel = channelList.channels[0];
        }
        if(!channel){
            alert('존재하지 않는 채널 혹은 한번도 방송하지 않은 채널입니다.');
        }else{
            redirectChannel(channel.channelId);
        }
        return;
    }

    updateQuiz(gameState)
    await checkLiveState(channelId);
    setInterval(() => checkLiveState(channelId), 10 * 1000);
});