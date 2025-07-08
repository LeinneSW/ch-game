import {loadQuizzes, saveQuizzes, shuffle} from '../../util/util.js';
import {resetScores, setGameState} from "../../game/js/data.js";
import {createModal} from "../../util/modal.js";

const renderQuizList = () => {
    const quizListElement = document.getElementById('quiz-list');
    quizListElement.innerHTML = '';
    const quizzes = loadQuizzes();
    if(!quizzes.length){
        quizListElement.innerHTML = '<p>추가된 주제가 없습니다.</p>';
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
            const copyQuiz = {...quiz}
            shuffle(copyQuiz.items)
            const gameState = {
                round: 0,
                roundLength: copyQuiz.items.length - 1, // TODO: 라운드 개수 조절 기능
                solved: false,
                quiz: copyQuiz,
            };
            setGameState(gameState);
            resetScores()
            location.href = '/game/';
        };
        quizListElement.appendChild(card);
        card.querySelector('.del-btn').onclick = (e) => {
            e.stopPropagation(); // 카드 클릭 이벤트 막기
            if(confirm(`선택된 주제 '${quiz.topic}'을(를) 제거하시겠습니까?`)){
                quizzes.splice(index, 1);
                saveQuizzes(quizzes);
                renderQuizList();
            }
        };
    });
}

/**
 * @typedef {topic: string, description: string, items: QuizItem[]} Quiz
 * @typedef {word: string, aliases: string[], hints: string[]} QuizItem
 */
const parseQuiz = (json) => {
    const {topic, description, items} = json;
    if(typeof topic !== 'string' || typeof description !== 'string' || !Array.isArray(items)){
        throw new Error('데이터 구조가 잘못되었습니다.\n올바른 구조: {topic: string, description: string, items: QuizItem[]}');
    }
    for(const index in items){
        const {word, hints} = items[index];
        if(typeof word !== 'string' || !Array.isArray(hints)){
            throw new Error('QuizItem 구조가 올바르지 않습니다.\n올바른 구조: {word: string, hints: string[], aliases: string[]}');
        }
        items[index].aliases ??= [] // 외래어 등을 위해 추가(프루트, 푸르트 등)
    }
    return {topic, description, items}
}

const uploadQuiz = async (e) => {
    const quizzes = loadQuizzes();
    for(const file of e.target.files){
        let json
        try{
            json = JSON.parse(await file.text())
        }catch{}
        if(!json){
            const modalOptions = {
                type: 'alert',
                message: `'${file.name}'에 대해 문제 발생.\n올바른 JSON 파일이 아닙니다.`
            }
            await createModal(modalOptions);
            continue;
        }
        try{
            const quiz = parseQuiz(json);
            quizzes.push(quiz);
        }catch(e){
            await createModal({
                type: 'alert',
                message: `'${file.name}'에 대해 문제 발생.\n${e.message}`
            })
        }
    }
    saveQuizzes(quizzes);
    renderQuizList();
}

window.addEventListener('load', async () => {
    renderQuizList();
    const file = document.getElementById('file-input');
    file.addEventListener('change', uploadQuiz);
})