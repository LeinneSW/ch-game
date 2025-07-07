const modalInnerHTML = `
<div class="modal" role="dialog" aria-modal="true">
    <h2 class="modal-title"></h2>
    <p class="modal-body"></p>
    <footer class="modal-footer"></footer>
</div>
`;

const createModalButton = (text, className) => {
    const b = document.createElement('button');
    b.textContent = text;
    b.className = `modal-button ${className}`;
    return b;
}

/**
 * @param {{
 *   type: 'alert' | 'confirm' | 'prompt',
 *   message: string,
 *   title?: string,
 *   backdrop?: 'static' | 'none' | 'dismiss'
 * }} modalOptions
 */
export const createModal = ({type, message, title, backdrop}) => {
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
        footer.append(createModalButton('확인', 'primary'));
        switch(type){
            case 'alert':
                break;
            case 'confirm':
                footer.append(createModalButton('취소', 'ghost'));
                break;
            case 'prompt':
                modalBody.innerHTML += '<br><input type="text" class="modal-input">';
                footer.append(createModalButton('취소', 'ghost'));
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
        let cancelValue = false;
        const modalInput = modalBody.querySelector('.modal-input');
        const [confirmBtn, cancelBtn] = footer.querySelectorAll('button');
        if(modalInput != null){
            cancelValue = null;
            modalInput.addEventListener('keydown', (e) => e.key === 'Enter' && confirmBtn.click());
        }

        confirmBtn.onclick = () => close(modalInput?.value || true)
        cancelBtn && (cancelBtn.onclick = () => close(cancelValue));
        switch(backdrop){
            case 'static':
                break;
            case 'none':
                overlay.style.background = 'transparent';
                break;
            default: // dismiss
                overlay.onclick = (e) => e.target === overlay && close(cancelValue); // 외부 클릭시 닫히게
                document.addEventListener('keydown', (e) => e.key === 'Escape' && close(cancelValue), {once: true});
                break;
        }

        // 6) DOM 삽입 + 애니메이션
        document.body.append(overlay);
        requestAnimationFrame(() => {
            overlay.classList.add('active')
            modalInput && modalInput.focus();
        });
    });
}