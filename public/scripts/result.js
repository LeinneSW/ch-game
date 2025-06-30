import {getSessionData} from './utils.js';

const scores = getSessionData('scoreboard');
if(!scores) location.href = 'index.html';

const $list = document.getElementById('score-list');
Object.values(scores)
    .sort((a, b) => b.score - a.score)
    .forEach(({profile, score}, idx) => {
        const li = document.createElement('li');
        li.textContent = `${idx + 1}. ${profile.nickname} — ${score} 점`;
        $list.appendChild(li);
    });