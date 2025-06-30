import {toChosung} from "../utils.js";

const $chosungBox = document.getElementById('chosung-box');
const $roundInfo = document.getElementById('round-info');
const $rankGraph = document.getElementById('rank-graph');
const $hintBox = document.getElementById('hint-list');
const $answerLabel = document.getElementById('answer-label');
const $nextBtn = document.getElementById('next-btn');

const tier2ColorList = {};
const cheatKeyColorList = {};

const nicknameColors = [
    "#EEA05D", "#EAA35F", "#E98158", "#E97F58",
    "#E76D53", "#E66D5F", "#E16490", "#E481AE",
    "#E481AE", "#D25FAC", "#D263AE", "#D66CB4",
    "#D071B6", "#AF71B5", "#A96BB2", "#905FAA",
    "#B38BC2", "#9D78B8", "#8D7AB8", "#7F68AE",
    "#9F99C8", "#717DC6", "#7E8BC2", "#5A90C0",
    "#628DCC", "#81A1CA", "#ADD2DE", "#83C5D6",
    "#8BC8CB", "#91CBC6", "#83C3BB", "#7DBFB2",
    "#AAD6C2", "#84C194", "#92C896", "#94C994",
    "#9FCE8E", "#A6D293", "#ABD373", "#BFDE73"
]
const getUserColor = (seed) => {
    const index = seed.split("")
        .map((c) => c.charCodeAt(0))
        .reduce((a, b) => a + b, 0) % nicknameColors.length
    return nicknameColors[index]
}

const htmlEntity = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
}
export const escapeHTML = (s) => {
    return s.replace(/[&<>"']/g, m => htmlEntity[m]);
}

export const addMessageBox = (profile, message, msecs = Date.now(), colorData = 'white', emojiList = {}, badgeList = []) => {
    const chatBox = document.getElementById('chat-container');
    const messageBoxDiv = document.createElement('div')
    messageBoxDiv.id = msecs + ''
    messageBoxDiv.dataset.userIdHash = profile.userIdHash
    messageBoxDiv.className = 'message-box'
    chatBox.appendChild(messageBoxDiv)

    const userSpan = document.createElement('span')
    userSpan.className = 'nickname'
    userSpan.textContent = profile.nickname
    if(typeof colorData === 'string'){
        userSpan.style.color = colorData
    }else{
        switch(colorData.effectType){
            case 'GRADATION':
                const direction = colorData.effectValue.direction.toLowerCase();
                const startColor = colorData.darkRgbValue;
                const endColor = colorData.effectValue.darkRgbEndValue;
                userSpan.style.backgroundImage = `linear-gradient(to ${direction}, ${startColor}, ${endColor})`;
                userSpan.style.backgroundClip = 'text';
                userSpan.style.webkitBackgroundClip = 'text';
                userSpan.style.color = 'transparent';
                break;
            case 'HIGHLIGHT':
                userSpan.style.color = colorData.darkRgbValue;
                userSpan.style.backgroundColor = colorData.effectValue.darkRgbBackgroundValue;
                break;
            case 'STEALTH':
                userSpan.style.color = 'transparent';
                break;
        }
    }
    messageBoxDiv.appendChild(userSpan)

    const messageSpan = document.createElement('span')
    messageSpan.className = 'message'

    message = escapeHTML(message)
    for(const emojiName in emojiList){
        message = message.replaceAll(`{:${emojiName}:}`, `<img class='emoji' src='${emojiList[emojiName]}' alt="emoji">`)
    }
    messageSpan.innerHTML = ` : ${message}`
    messageBoxDiv.appendChild(messageSpan)

    const threshold = 10; // 오차 허용값 (px)
    if(chatBox.scrollHeight - (chatBox.scrollTop + chatBox.clientHeight + messageBoxDiv.clientHeight) <= threshold){
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

export const clearChatBox = () => {
    const chatBox = document.getElementById('chat-container');
    while(chatBox.firstChild){
        chatBox.removeChild(chatBox.firstChild);
    }
}

export const convertColorCode = (colorCode, userId, chatChannelId) => {
    if(colorCode.startsWith('CC')){
        return cheatKeyColorList[colorCode] || getUserColor(userId + chatChannelId);
    }
    return tier2ColorList[colorCode];
}

export const updateQuiz = (gameState) => {
    const currentWord = gameState.quiz.items[gameState.round].word;
    const currentHints = gameState.quiz.items[gameState.round].hints;

    // UI 초기화
    $roundInfo.textContent = `라운드 ${gameState.round + 1}`;
    $hintBox.innerHTML = '';
    $chosungBox.innerHTML = '';
    $answerLabel.innerText = currentWord;
    toChosung(currentWord).forEach((cho, index) => {
        const li = document.createElement('li');
        li.dataset.full = currentWord[index];
        li.textContent = li.dataset.cho = cho;

        let isChosung = true;
        li.onclick = () => {
            li.textContent = (isChosung = !isChosung) ? li.dataset.cho : li.dataset.full;
        };
        $chosungBox.appendChild(li);
    });
    currentHints.forEach(h => {
        const li = document.createElement('li');
        li.textContent = h;
        $hintBox.appendChild(li);
    });
    $nextBtn.hidden = !gameState.solved;
}

export function updateRankGraph(scores){
    const top = Object.values(scores).sort((a, b) => b.score - a.score).slice(0, 3); // 상위 3명
    if(top.length < 1){
        return;
    }

    $rankGraph.innerHTML = '';
    for(const i of [1, 0, 2]){ // 2 1 3 순으로 출력
        const data = top[i]
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${(data?.score || 0) * 100 / top[0].score}%`;
        if(data){
            bar.innerHTML = `<span class="bar-score">${data.score}</span>
                <span class="bar-name">${escapeHTML(data.profile.nickname)}</span>`;
        }
        $rankGraph.appendChild(bar);
    }
}

window.addEventListener('load', async () => {
    const colorCodes = await (await fetch('/colorCodes')).json();
    for(const index in colorCodes){
        const colorData = colorCodes[index];
        switch(colorData.availableScope){
            case 'CHEATKEY':
                cheatKeyColorList[colorData.code] = colorData.darkRgbValue;
                break;
            case 'SUBSCRIPTION_TIER2':
                tier2ColorList[colorData.code] = colorData;
                break;
        }
    }
})