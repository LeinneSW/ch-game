import {getScores, resetGameState, resetScores, restartGame} from "../../game/js/data.js";

window.addEventListener("load", () => {
    const scores = Object.values(getScores()).sort((a, b) => b.score - a.score);
    const list = document.getElementById('score-list');
    if(scores.length > 0){
        scores.forEach(({profile, score}, idx) => {
            const li = document.createElement('li');
            li.textContent = `${idx + 1}. ${profile.nickname} — ${score} 점`;
            list.appendChild(li);
        });
    }else{
        const li = document.createElement('li');
        li.textContent = '정답자가 한 명도 없습니다';
        list.appendChild(li);
    }

    const restartButton = document.getElementById('restart-button');
    restartButton.onclick = () => {
        restartGame();
        location.href = '/game/'
    }
    const homeButton = document.getElementById('home-button');
    homeButton.onclick = () => {
        resetScores()
        resetGameState()
        location.href = '/home/'
    }
})