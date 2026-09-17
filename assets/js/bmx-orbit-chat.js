
document.addEventListener("DOMContentLoaded", () => {

    const bwxInput =
        document.getElementById("bwxOrbitInput");

    const bwxSend =
        document.getElementById("bwxOrbitSend");

    const bwxConversation =
        document.getElementById("bwxOrbitConversation");

    const bwxSuggestions =
        document.querySelectorAll(".bwx-orbit-suggestion");


    /*
    =========================================================
    BWX AI RESPONSE FORMATTER
    =========================================================
    Converts basic Markdown from Wilson AI into safe HTML.

    Supported:
    - Bullet points
    - Clickable Markdown links
    - Headings
    - Paragraphs
    */


    function bwxEscapeHTML(text) {

        const element =
            document.createElement("div");

        element.textContent = text;

        return element.innerHTML;
    }


    function bwxFormatInlineMarkdown(text) {

        let formatted =
            bwxEscapeHTML(text);


        /*
        ---------------------------------------------------------
        Markdown links

        Example:
        [SQL Portfolio](http://example.com/page.html)
        ---------------------------------------------------------
        */

        // formatted = formatted.replace(
        //     /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        //     (match, linkText, url) => {

        //         return `
        //             <a
        //                 href="${url}"
        //                 target="_blank"
        //                 rel="noopener noreferrer"
        //                 class="bwx-orbit-link"
        //             >
        //                 ${linkText}
        //             </a>
        //         `;
        //     }
        // );
            formatted = formatted.replace(
                /\[([^\]]+)\]\\?\(([^)\s]+)\\?\)/g,
                (match, linkText, url) => {

                    return `
                        <a
                            href="${url}"
                            class="bwx-orbit-link"
                        >
                            ${linkText}
                        </a>
                    `;
                }
            );




        /*
        ---------------------------------------------------------
        Bold text

        Example:
        **Important**
        ---------------------------------------------------------
        */

        formatted = formatted.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


        return formatted;
    }


    function bwxFormatAIMessage(message) {

        const lines =
            message.split(/\r?\n/);

        let html = "";

        let bulletItems = [];


        function closeBulletList() {

            if (bulletItems.length === 0) {
                return;
            }

            html += "<ul>";

            bulletItems.forEach((item) => {

                html += `
                    <li>
                        ${bwxFormatInlineMarkdown(item)}
                    </li>
                `;

            });

            html += "</ul>";

            bulletItems = [];
        }


        lines.forEach((line) => {

            const trimmed =
                line.trim();


            /*
            -----------------------------------------------------
            Blank line
            -----------------------------------------------------
            */

            if (!trimmed) {

                closeBulletList();

                return;
            }


            /*
            -----------------------------------------------------
            Bullet point

            Supports:
            - Item
            * Item
            -----------------------------------------------------
            */

            const bulletMatch =
                trimmed.match(/^[-*]\s+(.+)$/);

            if (bulletMatch) {

                bulletItems.push(
                    bulletMatch[1]
                );

                return;
            }


            /*
            -----------------------------------------------------
            Headings

            Supports:
            # Heading
            ## Heading
            ### Heading
            -----------------------------------------------------
            */

            const headingMatch =
                trimmed.match(/^#{1,3}\s+(.+)$/);

            if (headingMatch) {

                closeBulletList();

                html += `
                    <h4 class="bwx-orbit-ai-heading">
                        ${bwxFormatInlineMarkdown(
                            headingMatch[1]
                        )}
                    </h4>
                `;

                return;
            }


            /*
            -----------------------------------------------------
            Normal paragraph
            -----------------------------------------------------
            */

            closeBulletList();

            html += `
                <p class="bwx-orbit-ai-paragraph">
                    ${bwxFormatInlineMarkdown(trimmed)}
                </p>
            `;

        });


        closeBulletList();


        return html;
    }


    /*
    =========================================================
    ADD MESSAGE
    =========================================================
    */


    function bwxAddMessage(message, type) {

        const messageElement =
            document.createElement("div");


        messageElement.className =
            `bwx-orbit-message bwx-orbit-message-${type}`;


        /*
        AI messages receive Markdown formatting.
        User messages remain plain text.
        */

        if (type === "ai") {

            messageElement.innerHTML =
                bwxFormatAIMessage(message);

        } else {

            messageElement.textContent =
                message;
        }


        bwxConversation.appendChild(
            messageElement
        );


        bwxConversation.scrollTop =
            bwxConversation.scrollHeight;
    }

    /*
    =========================================================
    BWX AI THINKING STATUS
    =========================================================
    */
    
    function bwxShowStatus(type, text) {
    
        bwxHideStatus();
    
        const status =
            document.createElement("div");
    
        status.id = "bwxOrbitThinkingStatus";
        status.className = "bwx-orbit-thinking-status";
    
        let icon = "";
    
        if (type === "thinking") {
    
            icon = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 21h6M10 17h4M8.5 14.5C7 13.4 6 11.7 6 9.7
                    A6 6 0 0 1 18 9.7c0 2-1 3.7-2.5 4.8
                    -.8.6-1.2 1.2-1.5 2.5h-4c-.3-1.3-.7-1.9-1.5-2.5Z"/>
                </svg>
            `;
    
        } else if (type === "github") {
    
            icon = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor"
                        d="M12 .7A11.3 11.3 0 0 0 8.4 22.8c.57.1.78-.25.78-.55
                        0-.27-.01-1.16-.02-2.1-3.16.69-3.83-1.34-3.83-1.34
                        -.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7
                        1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25
                        3.33.96.1-.74.4-1.25.73-1.54-2.52-.29-5.17-1.26
                        -5.17-5.61 0-1.24.44-2.25 1.16-3.05-.12-.29-.5-1.45.11-3.02
                        0 0 .95-.31 3.12 1.16A10.8 10.8 0 0 1 12 6.17
                        c.96 0 1.92.13 2.82.38 2.17-1.47 3.12-1.16 3.12-1.16
                        .61 1.57.23 2.73.11 3.02.72.8 1.16 1.81 1.16 3.05
                        0 4.36-2.65 5.32-5.18 5.6.41.35.78 1.04.78 2.1
                        0 1.52-.01 2.75-.01 3.12 0 .3.21.66.79.55A11.3 11.3 0 0 0 12 .7Z"/>
                </svg>
            `;
    
        } else if (type === "portfolio") {
    
            icon = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="3"/>
                    <path d="M8 5V3h8v2M7 10h10M7 14h6"/>
                </svg>
            `;
    
        } else if (type === "generating") {
    
            icon = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1
                    M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>
                </svg>
            `;
        }
    
        status.innerHTML = `
            <span class="bwx-orbit-thinking-icon">
                ${icon}
            </span>
    
            <span class="bwx-orbit-thinking-text">
                ${text}
            </span>
        `;
    
        bwxConversation.appendChild(status);
    
        bwxConversation.scrollTop =
            bwxConversation.scrollHeight;
    }
    
    
    function bwxHideStatus() {
    
        const status =
            document.getElementById(
                "bwxOrbitThinkingStatus"
            );
    
        if (status) {
            status.remove();
        }
    }
    /*
    =========================================================
    GET AI RESPONSE
    =========================================================
    */


    async function bwxGetAIResponse(question) {

        try {

            const response =
                await fetch(
                    "https://bradwilsonitprofessional-six.vercel.app/api/chat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            message: question
                        })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Server error: ${response.status}`
                );
            }


            const data =
                await response.json();
            
            const thinkingStatus =
                document.getElementById(
                    "bwxOrbitThinkingStatus"
                );
            
            if (thinkingStatus) {
                thinkingStatus.remove();
            }
            
            bwxAddMessage(
                data.response,
                "ai"
            );


        } catch (error) {

            console.error(
                "Wilson AI error:",
                error
            );
            
            bwxHideStatus();

            bwxAddMessage(
                "I couldn't connect to the AI backend.",
                "ai"
            );
        }
    }


    /*
    =========================================================
    SUBMIT QUESTION
    =========================================================
    */


    function bwxSubmitQuestion() {

        const question =
            bwxInput.value.trim();


        if (!question) {
            return;
        }


        const welcome =
            bwxConversation.querySelector(
                ".bwx-orbit-welcome"
            );


        if (welcome) {
            welcome.remove();
        }


        bwxAddMessage(
            question,
            "user"
        );
        bwxShowStatus(
            "thinking",
            "Thinking..."
        );

        bwxInput.value = "";


        bwxGetAIResponse(
            question
        );
    }


    /*
    =========================================================
    SEND BUTTON
    =========================================================
    */


    bwxSend.addEventListener(
        "click",
        bwxSubmitQuestion
    );


    /*
    =========================================================
    ENTER KEY
    =========================================================
    */


    bwxInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                bwxSubmitQuestion();
            }

        }
    );


    /*
    =========================================================
    SUGGESTION BUTTONS
    =========================================================
    */


    bwxSuggestions.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    bwxInput.value =
                        button.textContent.trim();

                    bwxInput.focus();

                }
            );

        }
    );

});



/*
=========================================================
BWX SHOOTING STARS
=========================================================
*/


function bwxCreateShootingStar() {

    const star =
        document.createElement("div");


    star.className =
        "bwx-orbit-shooting-star";


    star.style.left =
        `${Math.random() * 100}%`;


    star.style.top =
        `${Math.random() * 65}%`;


    star.style.animationDuration =
        `${1.2 + Math.random() * 1.5}s`;


    document
        .getElementById("bwxOrbitChat")
        .appendChild(star);


    star.addEventListener(
        "animationend",
        () => {
            star.remove();
        }
    );
}



function bwxScheduleShootingStar() {

    const delay =
        2500 + Math.random() * 5000;


    setTimeout(
        () => {

            bwxCreateShootingStar();

            bwxScheduleShootingStar();

        },
        delay
    );
}



bwxScheduleShootingStar();

