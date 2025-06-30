import {loadQuizzes, saveQuizzes, setSessionData} from './utils.js';

const $list = document.getElementById('topic-list');
const $file = document.getElementById('file-input');

$file.addEventListener('change', async (e) => {
    const quizzes = loadQuizzes();
    for(const file of e.target.files){
        try{
            console.log(file);
            const txt = await file.text()
            const {topic, description, items} = JSON.parse(txt);
            if(typeof topic !== 'string' || typeof description !== 'string' || !Array.isArray(items)){
                alert(`데이터 구조가 잘못되었습니다. '${file.name}'\n올바른 구조: {topic: str, description: str, items: QuizItem[]}`)
                continue;
            }
            let valid = true
            for(const {word, hints} of items){
                if(typeof word !== 'string' || !Array.isArray(hints)){
                    valid = false
                    alert(`단어 정의가 잘못되었습니다. '${file.name}'\n올바른 구조: [{word: string, hints: string[]}, ...]`)
                    break
                }
            }
            valid && quizzes.push({topic, description, items});
        }catch(e){
            alert(`잘못된 파일: '${file.name}'\n올바른 JSON 파일이 아닙니다.`);
        }
    }
    saveQuizzes(quizzes);
    render();
});

function render(){
    $list.innerHTML = '';
    const quizzes = loadQuizzes();
    if(!quizzes.length){
        $list.innerHTML = '<p>추가된 주제가 없습니다.</p>';
        return;
    }
    quizzes.forEach((quiz, index) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
            <button class="del-btn" title="삭제">✕</button>
            <h2>${quiz.topic}</h2>
            <p>${quiz.description}</p>`;
        card.onclick = () => {
            /**
             * quiz: {topic: string, description: string, items: QuizItem[]}
             * QuizItem: {word: string, hints: string[]}
             * */
            const gameState = {
                round: 0,
                solved: false,
                quiz,
            };
            setSessionData('scoreboard', {});
            setSessionData('gameState', gameState);
            location.href = 'game.html';
        };
        $list.appendChild(card);
        card.querySelector('.del-btn').onclick = (e) => {
            e.stopPropagation(); // 카드 클릭 이벤트 막기
            if(confirm(`선택된 주제 '${quiz.topic}'을(를) 제거하시겠습니까?`)){
                quizzes.splice(index, 1);
                saveQuizzes(quizzes);
                render();
            }
        };
    });
}

render();