import {getScores} from "../../game/js/data.js";

window.addEventListener("load", () => {
    const scores = getScores();
    if(Object.keys(scores).length === 0){
        location.href = 'index.html';
        return;
    }

    const list = document.getElementById('score-list');
    Object.values(scores).sort((a, b) => b.score - a.score).forEach(({profile, score}, idx) => {
        const li = document.createElement('li');
        li.textContent = `${idx + 1}. ${profile.nickname} — ${score} 점`;
        list.appendChild(li);
    });
})