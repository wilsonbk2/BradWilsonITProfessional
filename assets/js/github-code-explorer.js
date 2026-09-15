

/* ============================================================
   GITHUB CODE EXPLORER
   ------------------------------------------------------------
   Usage:

   <div class="github-code-explorer"
        data-repository="wilsonbk2/wilsonbk2"
        data-branch="main">
   </div>

   You can place multiple explorers on the same page,
   each pointing to a different GitHub repository.
   ============================================================ */

/* ============================================================
   GITHUB CODE EXPLORER
   ============================================================ */

(function () {

    "use strict";


    /* ============================================================
       INITIALIZE ALL WIDGETS
       ============================================================ */

    function initializeGitHubCodeExplorers() {

        const explorers =
            document.querySelectorAll(
                ".github-code-explorer"
            );


        explorers.forEach(
            function (container) {

                /*
                 * Prevent the same widget from being
                 * initialized more than once.
                 */

                if (
                    container.dataset.gceInitialized === "true"
                ) {
                    return;
                }


                container.dataset.gceInitialized = "true";


                initializeExplorer(
                    container
                );

            }
        );

    }


    /* ============================================================
       INITIALIZE INDIVIDUAL WIDGET
       ============================================================ */

    function initializeExplorer(
        container
    ) {

        const repository =
            container.dataset.repository;


        const branch =
            container.dataset.branch || "main";


        if (!repository) {

            container.innerHTML =
                `
                <div class="gce-error">
                    GitHub repository not specified.
                </div>
                `;

            return;

        }


        const repositoryParts =
            repository.split("/");


        if (
            repositoryParts.length !== 2
        ) {

            container.innerHTML =
                `
                <div class="gce-error">
                    Invalid GitHub repository format.<br>
                    Use: username/repository
                </div>
                `;

            return;

        }


        const owner =
            repositoryParts[0];


        const repo =
            repositoryParts[1];


        createExplorerUI(
            container,
            owner,
            repo,
            branch
        );

    }


    /* ============================================================
       CREATE COMPLETE UI
       ============================================================ */

    function createExplorerUI(
        container,
        owner,
        repo,
        branch
    ) {

        container.innerHTML =
            `

            <div class="gce-wrapper">


                <!-- ============================================
                     HEADER
                     ============================================ -->

                <div class="gce-header">


                    <div class="gce-title">

                        <span class="gce-folder-icon">
                            ⌘
                        </span>

                        <span class="gce-repo-name">
                            Loading repository...
                        </span>

                    </div>


                    <a
                        class="gce-github-link"
                        href="https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View on GitHub ↗
                    </a>


                </div>



                <!-- ============================================
                     BODY
                     ============================================ -->

                <div class="gce-body">


                    <!-- ========================================
                         FILE TREE
                         ======================================== -->

                    <div class="gce-sidebar">


                        <div class="gce-sidebar-header">
                            FILES
                        </div>


                        <div class="gce-file-tree">

                            <div class="gce-loading">
                                Loading files...
                            </div>

                        </div>


                    </div>



                    <!-- ========================================
                         CODE VIEWER
                         ======================================== -->

                    <div class="gce-main">


                        <div class="gce-code-header">


                            <div>

                                <span class="gce-current-file">
                                    Select a file
                                </span>


                                <span class="gce-language">
                                </span>

                            </div>


                            <button
                                class="gce-copy-button"
                                type="button"
                            >
                                Copy Code
                            </button>


                        </div>



                        <div class="gce-code-container">


                            <table class="gce-code-table">

                                <tbody class="gce-code">
                                </tbody>

                            </table>


                            <div class="gce-code-message">

                                Select a file from the left.

                            </div>


                        </div>


                    </div>


                </div>


            </div>

            `;


        /* ========================================================
           GET ELEMENTS INSIDE THIS SPECIFIC WIDGET
           ======================================================== */

        const fileTree =
            container.querySelector(
                ".gce-file-tree"
            );


        const codeElement =
            container.querySelector(
                ".gce-code"
            );


        const codeMessage =
            container.querySelector(
                ".gce-code-message"
            );


        const currentFile =
            container.querySelector(
                ".gce-current-file"
            );


        const languageElement =
            container.querySelector(
                ".gce-language"
            );


        const copyButton =
            container.querySelector(
                ".gce-copy-button"
            );


        const repoName =
            container.querySelector(
                ".gce-repo-name"
            );


        let currentCode = "";


        /* ========================================================
           GITHUB URLS
           ======================================================== */

        const apiBase =
            `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;


        const rawBase =
            `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}`;



        /* ========================================================
           LOAD REPOSITORY
           ======================================================== */

        async function loadRepository() {

            try {

                const response =
                    await fetch(
                        `${apiBase}/git/trees/${encodeURIComponent(branch)}?recursive=1`
                    );


                if (!response.ok) {

                    throw new Error(
                        "Unable to access repository."
                    );

                }


                const data =
                    await response.json();


                repoName.textContent =
                    `${owner} / ${repo}`;


                const files =
                    data.tree.filter(
                        function (item) {

                            return item.type === "blob";

                        }
                    );


                fileTree.innerHTML =
                    "";


                if (
                    files.length === 0
                ) {

                    fileTree.innerHTML =
                        `
                        <div class="gce-loading">
                            No files found.
                        </div>
                        `;

                    return;

                }


                files.sort(
                    function (a, b) {

                        return a.path.localeCompare(
                            b.path
                        );

                    }
                );


                buildFileTree(
                    files
                );


                loadFile(
                    files[0].path
                );


            } catch (error) {

                console.error(
                    "GitHub Code Explorer:",
                    error
                );


                fileTree.innerHTML =
                    `
                    <div class="gce-loading">
                        Unable to load repository.
                    </div>
                    `;


                codeMessage.textContent =
                    "Unable to load GitHub repository.";

            }

        }



        /* ========================================================
           BUILD FILE TREE
           ======================================================== */

        function buildFileTree(
            files
        ) {

            files.forEach(
                function (
                    file,
                    index
                ) {

                    const fileElement =
                        document.createElement(
                            "div"
                        );


                    fileElement.className =
                        "gce-file";


                    if (
                        index === 0
                    ) {

                        fileElement.classList.add(
                            "active"
                        );

                    }


                    const icon =
                        document.createElement(
                            "span"
                        );


                    icon.className =
                        "gce-file-icon";


                    icon.textContent =
                        getFileIcon(
                            file.path
                        );


                    const name =
                        document.createElement(
                            "span"
                        );


                    name.className =
                        "gce-file-name";


                    name.textContent =
                        file.path;


                    fileElement.appendChild(
                        icon
                    );


                    fileElement.appendChild(
                        name
                    );


                    fileElement.addEventListener(
                        "click",
                        function () {


                            container
                                .querySelectorAll(
                                    ".gce-file"
                                )
                                .forEach(
                                    function (
                                        element
                                    ) {

                                        element.classList.remove(
                                            "active"
                                        );

                                    }
                                );


                            fileElement.classList.add(
                                "active"
                            );


                            loadFile(
                                file.path
                            );

                        }
                    );


                    fileTree.appendChild(
                        fileElement
                    );

                }
            );

        }



        /* ========================================================
           LOAD FILE
           ======================================================== */

        async function loadFile(
            filePath
        ) {

            currentFile.textContent =
                filePath;


            languageElement.textContent =
                getLanguage(
                    filePath
                );


            codeElement.innerHTML =
                "";


            codeMessage.style.display =
                "block";


            codeMessage.textContent =
                "Loading code...";


            try {

                const response =
                    await fetch(
                        `${rawBase}/${filePath}`
                    );


                if (!response.ok) {

                    throw new Error(
                        "Unable to load file."
                    );

                }


                currentCode =
                    await response.text();


                displayCode(
                    currentCode
                );


                codeMessage.style.display =
                    "none";


            } catch (error) {

                console.error(
                    "GitHub Code Explorer:",
                    error
                );


                codeMessage.textContent =
                    "Unable to load this file.";

            }

        }



        /* ========================================================
           DISPLAY CODE
           ======================================================== */

        function displayCode(
            code
        ) {

            codeElement.innerHTML =
                "";


            const lines =
                code.split("\n");


            lines.forEach(
                function (
                    line,
                    index
                ) {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    const lineNumber =
                        document.createElement(
                            "td"
                        );


                    lineNumber.className =
                        "gce-line-number";


                    lineNumber.textContent =
                        index + 1;


                    const codeLine =
                        document.createElement(
                            "td"
                        );


                    codeLine.className =
                        "gce-code-line";


                    /*
                     * IMPORTANT:
                     *
                     * textContent means source code
                     * is displayed safely and cannot
                     * execute as HTML/JavaScript.
                     */

                    codeLine.textContent =
                        line;


                    row.appendChild(
                        lineNumber
                    );


                    row.appendChild(
                        codeLine
                    );


                    codeElement.appendChild(
                        row
                    );

                }
            );

        }



        /* ========================================================
           COPY BUTTON
           ======================================================== */

        copyButton.addEventListener(
            "click",
            async function () {

                if (!currentCode) {

                    return;

                }


                try {

                    await navigator.clipboard.writeText(
                        currentCode
                    );


                    const originalText =
                        copyButton.textContent;


                    copyButton.textContent =
                        "Copied ✓";


                    setTimeout(
                        function () {

                            copyButton.textContent =
                                originalText;

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        "Copy failed:",
                        error
                    );

                }

            }
        );


        /* ========================================================
           START
           ======================================================== */

        loadRepository();

    }



    /* ============================================================
       FILE ICONS
       ============================================================ */

    function getFileIcon(
        filePath
    ) {

        const fileName =
            filePath
                .split("/")
                .pop()
                .toLowerCase();


        const extension =
            fileName.includes(".")
                ? fileName
                    .split(".")
                    .pop()
                : "";


        const icons = {

            py: "🐍",

            js: "🟨",

            ts: "🔷",

            html: "🌐",

            htm: "🌐",

            css: "🎨",

            json: "⚙️",

            xml: "📄",

            sql: "🗄️",

            bat: "▣",

            cmd: "▣",

            ps1: "▣",

            reg: "⚙️",

            vbs: "▣",

            md: "📘",

            txt: "📄",

            csv: "📊",

            xls: "📊",

            xlsx: "📊",

            gif: "🖼️",

            png: "🖼️",

            jpg: "🖼️",

            jpeg: "🖼️",

            svg: "🖼️"

        };


        return icons[extension] || "📄";

    }



    /* ============================================================
       LANGUAGE
       ============================================================ */

    function getLanguage(
        filePath
    ) {

        const fileName =
            filePath
                .split("/")
                .pop()
                .toLowerCase();


        const extension =
            fileName.includes(".")
                ? fileName
                    .split(".")
                    .pop()
                : "";


        const languages = {

            py: "Python",

            js: "JavaScript",

            ts: "TypeScript",

            html: "HTML",

            htm: "HTML",

            css: "CSS",

            json: "JSON",

            sql: "SQL",

            bat: "Batch",

            cmd: "Batch",

            ps1: "PowerShell",

            reg: "Registry",

            vbs: "VBScript",

            md: "Markdown",

            xml: "XML"

        };


        return languages[extension]
            || extension.toUpperCase();

    }



    /* ============================================================
       INITIALIZE WHEN DOM IS READY
       ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeGitHubCodeExplorers
        );

    } else {

        initializeGitHubCodeExplorers();

    }


})();