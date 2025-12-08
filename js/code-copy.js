document.addEventListener('DOMContentLoaded', () => {
    const codeBlocks = document.querySelectorAll('.code-block-wrapper');

    codeBlocks.forEach(wrapper => {
        const copyButton = wrapper.querySelector('.copy-code-button');
        const preElement = wrapper.querySelector('pre');
        const copyIcon = copyButton.querySelector('.copy-icon');
        const checkIcon = copyButton.querySelector('.check-icon');
        const copyTextSpan = copyButton.querySelector('.copy-text');

        if (!preElement || !copyButton) {
            return;
        }

        copyButton.addEventListener('click', async () => {
            const codeElement = preElement.querySelector('code');
            let textToCopy = '';

            if (codeElement) {
                textToCopy = codeElement.innerText;
            } else {
                textToCopy = preElement.innerText;
            }

            try {
                await navigator.clipboard.writeText(textToCopy);
                
                // Visual feedback
                copyTextSpan.textContent = 'Copied!';
                copyButton.classList.add('copied');
                copyIcon.style.display = 'none';
                checkIcon.style.display = 'inline-block';

                setTimeout(() => {
                    copyTextSpan.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                    copyIcon.style.display = 'inline-block';
                    checkIcon.style.display = 'none';
                }, 2000); 

            } catch (err) {
                console.error('Failed to copy text: ', err);
                copyTextSpan.textContent = 'Error';
                 setTimeout(() => {
                    copyTextSpan.textContent = 'Copy';
                }, 2000);
            }
        });
    });
});