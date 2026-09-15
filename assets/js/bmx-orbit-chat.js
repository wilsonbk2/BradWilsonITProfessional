
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
    GET AI RESPONSE
    =========================================================
    */


    async function bwxGetAIResponse(question) {

        try {

            const response =
                await fetch(
                    "http://127.0.0.1:8000/chat",
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


            bwxAddMessage(
                data.response,
                "ai"
            );


        } catch (error) {

            console.error(
                "Wilson AI error:",
                error
            );


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

