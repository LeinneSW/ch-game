import {ChzzkClient} from "https://cdn.skypack.dev/chzzk"
import {addMessage, clearMessageList, convertColorCode, updateQuiz, updateRankGraph} from "./ui.js";
import {getChannelId} from '../../util/util.js';
import {getGameState, getScores, resetGameState, resetScores, setGameState, setScores} from "./data.js";
import {createModal} from "../../util/modal.js";

const scores = getScores()
const gameState = getGameState()

const connectChannel = async (client, channelId) => {
    let liveStatus;
    try{
        liveStatus = await client.live.status(channelId);
    }catch(e){}
    if(typeof liveStatus !== 'object' || liveStatus?.chatChannelId == null){ // liveStatus nullable 방지
        setTimeout(() => connectChannel(client, channelId), 1000); // 1초뒤 재시도
        return;
    }

    let startTime = Date.now();
    const chzzkChat = client.chat(liveStatus.chatChannelId);
    chzzkChat.on('connect', () => {
        clearMessageList()
        startTime = Date.now();
        chzzkChat.requestRecentChat(50)
    })
    chzzkChat.on('disconnect', () => setTimeout(() => connectChannel(client, channelId), 1000))
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

window.addEventListener('load', () => {
    let channelId = getChannelId()
    if(!channelId || !gameState){
        location.href = '/home/';
        return;
    }
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
    connectChannel(client, channelId).then(() => {});
});

