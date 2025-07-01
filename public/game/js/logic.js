import {ChzzkClient} from "https://cdn.skypack.dev/chzzk"
import {addMessageBox, clearChatBox, convertColorCode, updateQuiz, updateRankGraph} from "./ui.js";
import {getChannelId} from '../../util/util.js';
import {getGameState, getScores, setGameState, setScores} from "./data.js";

let chzzkChat;
let liveStatus;

const scores = getScores()
const gameState = getGameState()

const checkLiveState = async (client, channelId) => {
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
        connectChannel(client);
    }
}

const connectChannel = (client) => {
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

        addMessageBox(chat.profile, message, date, colorData, emojiList);
        if(!gameState.solved && startTime <= date && message.trim() === gameState.quiz.items[gameState.round].word){
            onQuizSolved(chat.profile);
        }
    });
    chzzkChat.connect().catch(() => {});
}

function onQuizSolved(profile){
    gameState.solved = true;
    setGameState(gameState)

    document.getElementById('next-btn').hidden = false;
    scores[profile.userIdHash] ??= {
        profile,
        score: 0
    }
    scores[profile.userIdHash].score += 100;
    setScores(scores)
    // TODO: 정답자 및 정답 modal
    // TODO: fanfare effect
    updateRankGraph(scores);
}

function nextRound(){
    ++gameState.round
    gameState.solved = false;
    setGameState(gameState);

    if(gameState.round >= gameState.quiz.items.length){
        location.href = '/result/';
        return;
    }
    updateQuiz(gameState)
    updateRankGraph(scores);
}

window.addEventListener('load', async () => {
    let channelId = getChannelId()
    if(!channelId){
        location.href = 'index.html';
        return;
    }

    if(!gameState){
        location.href = 'index.html';
        return
    }

    document.getElementById('next-btn').onclick = nextRound;
    updateQuiz(gameState)
    updateRankGraph(scores)

    const client = new ChzzkClient({
        baseUrls: {
            chzzkBaseUrl: "/cors/chzzk",
            gameBaseUrl: "/cors/game"
        }
    });
    await checkLiveState(client, channelId);
    setInterval(() => checkLiveState(client, channelId), 10 * 1000);
});