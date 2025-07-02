import {ChzzkClient} from "https://cdn.skypack.dev/chzzk"
import {addMessage, clearMessageList, convertColorCode, updateQuiz, updateRankGraph} from "./ui.js";
import {getChannelId} from '../../util/util.js';
import {getGameState, getScores, setGameState, setScores} from "./data.js";

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

window.addEventListener('load', () => {
    let channelId = getChannelId()
    if(!channelId || !gameState){
        location.href = '/home/';
        return;
    }

    document.getElementById('next-btn').onclick = nextRound;
    if(gameState.solved){
        nextRound()
    }else{
        updateQuiz(gameState)
        updateRankGraph(scores)
    }

    const client = new ChzzkClient({
        baseUrls: {
            chzzkBaseUrl: "/cors/chzzk",
            gameBaseUrl: "/cors/game"
        }
    });
    connectChannel(client, channelId).then(() => {});
});