const modalInnerHTML = `
<div class="modal" role="dialog" aria-modal="true">
    <button class="close-btn" aria-label="닫기">&times;</button>
    <h2 class="modal-title"></h2>
    <p class="modal-body"></p>
    <footer class="modal-footer"></footer>
</div>
`;

/**
 * @param {'alert' | 'confirm' | 'prompt'} type
 * @param {string} message
 * @param {string} title
 */
export const createModal = (type, message, title = '') => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = modalInnerHTML;

        const modalTitle = overlay.querySelector('.modal-title');
        title && (modalTitle.textContent = title);

        const modalBody = overlay.querySelector('.modal-body');
        modalBody.innerHTML = message.trim().replace(/\n/g, '<br>');

        const footer = overlay.querySelector('.modal-footer');
        const btn = (text, className) => {
            const b = document.createElement('button');
            b.textContent = text;
            b.className = `modal-button ${className}`;
            return b;
        };

        switch(type){
            case 'alert':
                footer.append(btn('확인', 'primary'));
                break;
            case 'confirm':
                footer.append(btn('확인', 'primary'), btn('취소', 'ghost'));
                break;
            case 'prompt':
                modalBody.innerHTML += '<br><input type="text" class="modal-input">';
                footer.append(btn('확인', 'primary'), btn('취소', 'ghost'));
                break;
            default:
                throw new Error(`Unknown modal type: ${type}`);
        }

        // 4) 공통 닫기 로직
        const close = (result) => {
            overlay.classList.remove('active');
            overlay.classList.add('leaving');
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
                resolve(result);           // Promise 반환
            }, {once: true});
        };

        // 5) 이벤트 바인딩
        let confirmValue = true, cancelValue = false;
        const modalInput = modalBody.querySelector('.modal-input');
        const [confirmBtn, cancelBtn] = footer.querySelectorAll('button');
        if(modalInput != null){
            confirmValue = modalInput.value
            cancelValue = null;
            modalInput.addEventListener('keydown', (e) => e.key === 'Enter' && confirmBtn.click());
        }

        confirmBtn.onclick = () => close(confirmValue);
        cancelBtn.onclick = overlay.querySelector('.close-btn').onclick = () => close(cancelValue);
        overlay.onclick = (e) => e.target === overlay && close(cancelValue); // 외부 클릭시 닫히게
        document.addEventListener('keydown', (e) => e.key === 'Escape' && close(cancelValue), {once: true});

        // 6) DOM 삽입 + 애니메이션
        document.body.append(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
    });
}