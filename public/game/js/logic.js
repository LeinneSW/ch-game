import {ChzzkClient} from "https://cdn.skypack.dev/chzzk"
import {addMessage, clearMessageList, convertColorCode, updateQuiz, updateRankGraph, updateSteamerInfo} from "./ui.js";
import {getChannelId, resetChannelId, setChannelId} from '../../util/util.js';
import {getGameState, getScores, resetGameState, resetScores, setGameState, setScores} from "./data.js";
import {createModal} from "../../util/modal.js";

const scores = getScores()
const gameState = getGameState()

const connectChannel = async (client) => {
    let liveStatus;
    try{
        liveStatus = await client.live.status(getChannelId());
    }catch(e){}
    if(typeof liveStatus !== 'object' || liveStatus?.chatChannelId == null){ // liveStatus nullable 방지
        setTimeout(() => connectChannel(client), 1000); // 1초뒤 재시도
        return;
    }

    let startTime = Date.now();
    const chzzkChat = client.chat(liveStatus.chatChannelId);
    chzzkChat.on('connect', () => {
        clearMessageList()
        startTime = Date.now();
        chzzkChat.requestRecentChat(50)
    })
    chzzkChat.on('disconnect', () => setTimeout(() => connectChannel(client), 1000))
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

        addMessage(chat.profile, message, date, colorData, emojiList);
        startTime <= date && checkQuizAnswer(message.trim(), chat.profile)
    });
    chzzkChat.connect().catch(() => {});
}

function checkQuizAnswer(answer, profile){
    if(gameState.solved){ // 이미 정답을 맞춘 경우
        return
    }

    const currentItem = gameState.quiz.items[gameState.round];
    if(profile == null){
        if(answer != null){
            return
        }
        gameState.solved = true;
        setGameState(gameState)
        createModal({
            type: 'alert',
            message: '아무도 정답을 맞추지 못했습니다.'
        }).then(() => nextRound())
    }else if(currentItem.word === answer || currentItem.aliases.includes(answer)){
        gameState.solved = true;
        setGameState(gameState)

        scores[profile.userIdHash] ??= {
            profile,
            score: 0
        }
        scores[profile.userIdHash].score += 100;
        setScores(scores)
        updateRankGraph(scores);
        createModal({
            type: 'alert',
            title: `${profile.nickname}님 정답!`,
            message: `정답: ${answer}`,
        }).then(() => nextRound())
        // TODO: fanfare effect
    }
}

function nextRound(){
    ++gameState.round
    gameState.solved = false;
    setGameState(gameState);

    if(gameState.round >= gameState.roundLength){
        location.href = '/result/';
    }
    renderRound();
}

const renderRound = () => {
    const showChar = [];
    const chosungList = updateQuiz(gameState)
    chosungList.forEach((li, index) => {
        li.onclick = () => {
            li.textContent = (showChar[index] = !showChar[index]) ? li.dataset.char : li.dataset.cho;
            showChar.filter(Boolean).length === chosungList.length && checkQuizAnswer()
        };
    })
    updateRankGraph(scores)
}

// 실수로 인한 페이지 이동 방지
function lockHistory() {
    history.pushState(null, '', location.href);     // 더미 스택 추가
}

window.addEventListener('load', async () => {
    document.getElementById('home-btn').onclick = async () => {
        const modalOptions = {
            type: 'confirm',
            title: '게임 종료',
            message: '정말 진행중이던 게임을 종료하고 홈 화면으로 돌아가시겠습니까?',
        }
        if(await createModal(modalOptions)){
            resetScores()
            resetGameState()
            location.href = '/home/'
        }
    };
    document.getElementById('next-btn').onclick = () => nextRound
    if(gameState.solved){
        nextRound()
    }else{
        renderRound();
    }

    lockHistory();
    window.addEventListener('popstate', lockHistory);

    const client = new ChzzkClient({
        baseUrls: {
            chzzkBaseUrl: "/cors/chzzk",
            gameBaseUrl: "/cors/game"
        }
    });
    let channelId = getChannelId()
    if(channelId.length !== 32){
        const modalOptions = {
            type: 'prompt',
            message: '본인의 치지직 닉네임 혹은 채널 ID를 입력해주세요',
            backdrop: 'static',
        }
        channelId = await createModal(modalOptions)
    }
    let liveDetail;
    try{
        channelId.length === 32 && (liveDetail = await client.live.detail(channelId));
    }catch(e){}
    if(liveDetail == null || typeof liveDetail !== 'object'){
        let channel = null
        try{
            const channelList = await client.search.channels(channelId); // 닉네임으로 판단하여 채널 검색 수행
            channel = channelList.channels.find(channel => channel.channelName === channelId); // '정확히'일치하는 닉네임 탐색
        }catch{}
        channel && (liveDetail = await client.live.detail(channel.channelId))
    }

    if(!liveDetail?.channel.channelId || liveDetail.channel.channelId.length !== 32){
        resetChannelId()
        const modalOptions = {
            type: 'alert',
            message: '잘못된 닉네임 혹은 방송한 이력이 없어 접속에 실패했습니다'
        }
        await createModal(modalOptions)
        // TODO: 재접속 기능 구현
        //setTimeout(() => location.reload(), 500);
        return
    }

    if(liveDetail.chatChannelId == null){
        const modalOptions = {
            type: 'alert',
            message: '현재 방송이 19세로 설정되어있습니다.\n19세 해제 후 이용 부탁드립니다. (19세 설정시 채팅 조회 불가)'
        }
        await createModal(modalOptions)
    }
    liveDetail.channel.channelId !== channelId && setChannelId(liveDetail.channel.channelId)
    updateSteamerInfo(liveDetail.channel).catch(console.error)
    connectChannel(client).then(() => {});
});

