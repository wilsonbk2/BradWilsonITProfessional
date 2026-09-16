document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("bwxOrbitSpace");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const stars = [];
    const galaxyStars = [];
    const shootingStars = [];
    const nebulaParticles = [];

    const mouse = {
        x: 0,
        y: 0
    };

    const config = {
        stars: 1200,
        galaxyStars: 2600,
        nebulaParticles: 250,
        galaxyRotationSpeed: 0.00035
    };


    /* =========================================
       RESIZE
    ========================================= */

    function bwxResizeSpace() {

        const rect = canvas.getBoundingClientRect();

        width = rect.width;
        height = rect.height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );
    }


    /* =========================================
       RANDOM STAR
    ========================================= */

    function bwxCreateStar() {

        return {
            x: Math.random() * width,
            y: Math.random() * height,

            size:
                Math.random() * 1.6 + 0.2,

            brightness:
                Math.random() * 0.8 + 0.2,

            twinkle:
                Math.random() * Math.PI * 2,

            speed:
                Math.random() * 0.015 + 0.003
        };
    }


    /* =========================================
       GALAXY PARTICLE
    ========================================= */

    function bwxCreateGalaxyStar() {

        const angle =
            Math.random() * Math.PI * 2;

        const radius =
            Math.pow(Math.random(), 0.65) * 260;

        const armCount = 4;

        const arm =
            Math.floor(Math.random() * armCount);

        const spiral =
            radius * 0.018;

        const spread =
            (Math.random() - 0.5) * 0.7;

        return {

            radius,

            angle:
                angle +
                arm * (Math.PI * 2 / armCount) +
                spiral +
                spread,

            size:
                Math.random() * 1.5 + 0.2,

            brightness:
                Math.random() * 0.8 + 0.2,

            speed:
                0.0002 +
                Math.random() * 0.0005
        };
    }


    /* =========================================
       NEBULA PARTICLE
    ========================================= */

    function bwxCreateNebulaParticle() {

        return {

            x:
                -100 +
                Math.random() * 500,

            y:
                height * 0.15 +
                Math.random() * height * 0.7,

            size:
                Math.random() * 100 + 20,

            alpha:
                Math.random() * 0.035 + 0.005,

            drift:
                Math.random() * 0.0005 + 0.0001,

            phase:
                Math.random() * Math.PI * 2
        };
    }


    /* =========================================
       INITIALIZE
    ========================================= */

    function bwxInitializeSpace() {

        stars.length = 0;
        galaxyStars.length = 0;
        nebulaParticles.length = 0;

        for (
            let i = 0;
            i < config.stars;
            i++
        ) {

            stars.push(
                bwxCreateStar()
            );
        }

        for (
            let i = 0;
            i < config.galaxyStars;
            i++
        ) {

            galaxyStars.push(
                bwxCreateGalaxyStar()
            );
        }

        for (
            let i = 0;
            i < config.nebulaParticles;
            i++
        ) {

            nebulaParticles.push(
                bwxCreateNebulaParticle()
            );
        }
    }


    /* =========================================
       BACKGROUND
    ========================================= */

    function bwxDrawBackground() {

        ctx.fillStyle = "#02030a";

        ctx.fillRect(
            0,
            0,
            width,
            height
        );
    }


    /* =========================================
       NEBULA
    ========================================= */

    function bwxDrawNebula(time) {

        for (const particle of nebulaParticles) {

            const drift =
                Math.sin(
                    time * particle.drift +
                    particle.phase
                ) * 80;

            const gradient =
                ctx.createRadialGradient(
                    particle.x + drift,
                    particle.y,
                    0,
                    particle.x + drift,
                    particle.y,
                    particle.size
                );

            gradient.addColorStop(
                0,
                `rgba(90,120,255,${particle.alpha})`
            );

            gradient.addColorStop(
                0.5,
                `rgba(160,60,220,${particle.alpha * 0.5})`
            );

            gradient.addColorStop(
                1,
                "rgba(0,0,0,0)"
            );

            ctx.fillStyle = gradient;

            ctx.beginPath();

            ctx.arc(
                particle.x + drift,
                particle.y,
                particle.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }


    /* =========================================
       STAR FIELD
    ========================================= */

    function bwxDrawStars(time) {

        for (const star of stars) {

            const twinkle =
                0.55 +
                Math.sin(
                    time * star.speed +
                    star.twinkle
                ) * 0.35;

            ctx.globalAlpha =
                star.brightness * twinkle;

            ctx.fillStyle = "#ffffff";

            ctx.beginPath();

            ctx.arc(
                star.x,
                star.y,
                star.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }


    /* =========================================
       ANDROMEDA GALAXY
    ========================================= */

    let galaxyRotation = 0;

    function bwxDrawGalaxy() {

        galaxyRotation +=
            config.galaxyRotationSpeed;

        const galaxyX =
            width * 0.82 +
            mouse.x * 35;

        const galaxyY =
            height * 0.48 +
            mouse.y * 20;

        ctx.save();

        ctx.translate(
            galaxyX,
            galaxyY
        );

        ctx.rotate(-0.25);

        /*
            Flatten galaxy vertically
            to create disk perspective.
        */

        ctx.scale(
            1,
            0.42
        );

        for (const star of galaxyStars) {

            const angle =
                star.angle +
                galaxyRotation +
                star.radius * 0.001;

            const x =
                Math.cos(angle) *
                star.radius;

            const y =
                Math.sin(angle) *
                star.radius;

            /*
                Brightness increases toward
                the galactic center.
            */

            const centerBrightness =
                Math.max(
                    0,
                    1 -
                    star.radius / 300
                );

            ctx.globalAlpha =
                star.brightness *
                (0.25 + centerBrightness);

            ctx.fillStyle =
                star.radius < 70
                    ? "#fff1d0"
                    : "#b9c8ff";

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                star.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        /*
            Galactic core
        */

        const core =
            ctx.createRadialGradient(
                0,
                0,
                0,
                0,
                0,
                90
            );

        core.addColorStop(
            0,
            "rgba(255,245,220,1)"
        );

        core.addColorStop(
            0.15,
            "rgba(255,220,170,.8)"
        );

        core.addColorStop(
            0.45,
            "rgba(180,190,255,.35)"
        );

        core.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        ctx.globalAlpha = 1;

        ctx.fillStyle = core;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            100,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();

        ctx.globalAlpha = 1;
    }


    /* =========================================
       SHOOTING STAR
    ========================================= */

    function bwxCreateShootingStar() {

        const star = {

            x:
                Math.random() * width,

            y:
                Math.random() *
                height * 0.65,

            length:
                Math.random() * 100 + 100,

            speed:
                Math.random() * 7 + 8,

            life: 0,

            maxLife:
                Math.random() * 50 + 45
        };

        shootingStars.push(star);
    }


    function bwxDrawShootingStars(deltaTime) {

        for (
            let i = shootingStars.length - 1;
            i >= 0;
            i--
        ) {

            const star =
                shootingStars[i];

            const frameScale =
                deltaTime / 16.6667;
            
            star.x -=
                star.speed * frameScale;
            
            star.y +=
                star.speed * 0.65 * frameScale;
            
            star.life += frameScale;

            const alpha =
                1 -
                star.life /
                star.maxLife;

            const gradient =
                ctx.createLinearGradient(
                    star.x,
                    star.y,
                    star.x + star.length,
                    star.y - star.length * 0.65
                );

            gradient.addColorStop(
                0,
                `rgba(255,255,255,${alpha})`
            );

            gradient.addColorStop(
                0.4,
                `rgba(150,190,255,${alpha * 0.5})`
            );

            gradient.addColorStop(
                1,
                "rgba(0,0,0,0)"
            );

            ctx.strokeStyle = gradient;

            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(
                star.x,
                star.y
            );

            ctx.lineTo(
                star.x + star.length,
                star.y -
                star.length * 0.65
            );

            ctx.stroke();

            if (
                star.life >=
                star.maxLife
            ) {

                shootingStars.splice(
                    i,
                    1
                );
            }
        }
    }


    /* =========================================
       SHOOTING STAR TIMER
    ========================================= */

    function bwxScheduleShootingStar() {

        const delay =
            Math.random() * 5000 +
            2500;

        setTimeout(() => {

            bwxCreateShootingStar();

            bwxScheduleShootingStar();

        }, delay);
    }


    /* =========================================
       MOUSE PARALLAX
    ========================================= */

    document.addEventListener(
        "mousemove",
        (event) => {

            mouse.x =
                (event.clientX / window.innerWidth)
                - 0.5;

            mouse.y =
                (event.clientY / window.innerHeight)
                - 0.5;
        }
    );


    /* =========================================
       MAIN LOOP
    ========================================= */
    
    const bwxFrameInterval = 1000 / 30;
    
    function bwxAnimateSpace(time) {
    
        if (!bwxLastAnimationTime) {
            bwxLastAnimationTime = time;
        }
    
        const deltaTime =
            time - bwxLastAnimationTime;
    
        if (deltaTime < bwxFrameInterval) {
    
            requestAnimationFrame(
                bwxAnimateSpace
            );
    
            return;
        }
    
        bwxLastAnimationTime = time;
    
        ctx.clearRect(
            0,
            0,
            width,
            height
        );
    
        bwxDrawBackground();
    
        bwxDrawNebula(time);
    
        bwxDrawStars(time);
    
        bwxDrawGalaxy(deltaTime);
    
        bwxDrawShootingStars(deltaTime);
    
        requestAnimationFrame(
            bwxAnimateSpace
        );
    }

    /* =========================================
       START
    ========================================= */

    window.addEventListener(
        "resize",
        () => {

            bwxResizeSpace();
            bwxInitializeSpace();

        }
    );

    bwxResizeSpace();

    bwxInitializeSpace();

    bwxScheduleShootingStar();

    requestAnimationFrame(
        bwxAnimateSpace
    );

});
