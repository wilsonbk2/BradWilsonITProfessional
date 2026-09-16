

/* =========================================================
   BWX CONTACT BLACK HOLE
   ========================================================= */

(() => {

  const canvas = document.getElementById("bwx-blackhole-canvas");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");


  /* =======================================================
     OFFSCREEN STATIC CACHE
     ======================================================= */

  /*
   * These invisible canvases store the portions of the
   * black hole that do not need to be redrawn every frame.
   *
   * Separate layers preserve the original rendering order.
   */

  const staticUnderCanvas =
    document.createElement("canvas");

  const staticMiddleCanvas =
    document.createElement("canvas");

  const staticTopCanvas =
    document.createElement("canvas");


  const staticUnderCtx =
    staticUnderCanvas.getContext("2d");

  const staticMiddleCtx =
    staticMiddleCanvas.getContext("2d");

  const staticTopCtx =
    staticTopCanvas.getContext("2d");


  let width = 0;
  let height = 0;
  let dpr = 1;

  let stars = [];
  let shootingStars = [];
  let diskParticles = [];

  let lastTime = performance.now();
  let lastFrameTime = 0;
  let shootingStarTimer = 0;


  /* =======================================================
     CONFIG
     ======================================================= */

  const STAR_COUNT = 2500;
  const DISK_PARTICLE_COUNT = 2500;

  const BLACK_HOLE_X = 0.735;
  const BLACK_HOLE_Y = 0.505;

  const DISK_TILT = -0.38;

  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  let isVisible = true;

  /*
   * When the Contact section is outside the viewport,
   * dramatically reduce animation workload.
   */



  /* =======================================================
     RESIZE
     ======================================================= */

  function resize() {

    const rect = canvas.getBoundingClientRect();

    dpr =
      Math.min(
        window.devicePixelRatio || 1,
        2
      );

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

    createStars();

    createDiskParticles();

    /*
     * Static black-hole elements only need to be
     * rendered again when the canvas size changes.
     */

    renderStaticBlackHole();
  }


  /* =======================================================
     STAR FIELD
     ======================================================= */

  function createStars() {

    stars = [];

    for (let i = 0; i < STAR_COUNT; i++) {

      stars.push({

        x: Math.random(),
        y: Math.random(),

        radius:
          Math.random() < 0.9
            ? Math.random() * 0.9 + 0.15
            : Math.random() * 1.7 + 0.5,

        baseAlpha:
          Math.random() * 0.55 + 0.18,

        twinkleSpeed:
          Math.random() * 2.5 + 0.5,

        phase:
          Math.random() * Math.PI * 2

      });
    }
  }


  /* =======================================================
     DISK PARTICLES
     ======================================================= */

  function createDiskParticles() {

    diskParticles = [];

    for (
      let i = 0;
      i < DISK_PARTICLE_COUNT;
      i++
    ) {

      const angle =
        Math.random() *
        Math.PI *
        2;


      /*
       * Heavily weighted toward the inner disk.
       */

      const radius =
        Math.pow(
          Math.random(),
          .26
        ) *
        500 +
        20;


      diskParticles.push({

        angle,
        radius,

        speed:
          (
            0.35 +
            Math.random() * 0.45
          ) /
          Math.pow(
            radius / 100,
            0.45
          ),

        size:
          Math.random() * 1.4 + 0.25,

        alpha:
          Math.random() * 0.65 + 0.15,

        heat:
          Math.max(
            0,
            1 - radius / 600
          ),

        offset:
          (Math.random() - 0.5) * 0.9

      });
    }
  }


  /* =======================================================
     BLACK HOLE GEOMETRY
     ======================================================= */

  function getBlackHole() {

    const minDimension =
      Math.min(
        width,
        height
      );


    const radius =
      Math.max(
        68,
        Math.min(
          108,
          minDimension * 0.105
        )
      );


    return {

      x:
        width *
        BLACK_HOLE_X,

      y:
        height *
        BLACK_HOLE_Y,

      radius,

      photonRadius:
        radius * 1.14,

      diskRadius:
        radius * 8.5

    };
  }


  /* =======================================================
     BACKGROUND
     ======================================================= */

  function drawBackground(time) {

    ctx.clearRect(
      0,
      0,
      width,
      height
    );


    /*
     * Extremely subtle deep-space gradient.
     */

    const bg =
      ctx.createRadialGradient(
        width * 0.73,
        height * 0.5,
        0,
        width * 0.73,
        height * 0.5,
        width * 0.7
      );


    bg.addColorStop(
      0,
      "rgba(35, 18, 8, 0.18)"
    );

    bg.addColorStop(
      0.3,
      "rgba(13, 17, 29, 0.08)"
    );

    bg.addColorStop(
      1,
      "rgba(0, 0, 0, 0)"
    );


    ctx.fillStyle = bg;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );


    /*
     * Stars.
     */

    for (const star of stars) {

      const pulse =
        0.5 +
        0.5 *
        Math.sin(
          time *
          0.001 *
          star.twinkleSpeed +
          star.phase
        );


      const alpha =
        star.baseAlpha *
        (0.55 + pulse * 0.75);


      ctx.beginPath();

      ctx.arc(
        star.x * width,
        star.y * height,
        star.radius,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        `rgba(210,225,255,${alpha})`;

      ctx.fill();
    }
  }


  /* =======================================================
     SHOOTING STARS
     ======================================================= */

  function spawnShootingStar() {

    /*
     * Mostly enter from upper/right areas and travel
     * diagonally across the scene.
     */

    const fromTop =
      Math.random() < 0.7;


    const x =
      fromTop
        ? Math.random() * width
        : width + 30;


    const y =
      fromTop
        ? -30
        : Math.random() * height * 0.55;


    const angle =
      Math.PI *
      (0.35 + Math.random() * 0.16);


    const speed =
      500 +
      Math.random() * 500;


    shootingStars.push({

      x,
      y,

      vx:
        Math.cos(angle) *
        speed,

      vy:
        Math.sin(angle) *
        speed,

      life: 0,

      maxLife:
        0.55 +
        Math.random() * 0.7,

      length:
        90 +
        Math.random() * 170,

      brightness:
        0.45 +
        Math.random() * 0.55

    });
  }


  function updateShootingStars(dt) {

    shootingStarTimer -= dt;


    if (shootingStarTimer <= 0) {

      /*
       * Randomized timing prevents obvious repetition.
       */

      if (Math.random() < 0.8) {

        spawnShootingStar();
      }


      shootingStarTimer =
        1.8 +
        Math.random() * 4.5;
    }


    for (
      let i = shootingStars.length - 1;
      i >= 0;
      i--
    ) {

      const star =
        shootingStars[i];


      star.life += dt;

      star.x +=
        star.vx * dt;

      star.y +=
        star.vy * dt;


      if (
        star.life > star.maxLife ||
        star.x < -400 ||
        star.y > height + 400
      ) {

        shootingStars.splice(
          i,
          1
        );
      }
    }
  }


  function drawShootingStars() {

    ctx.save();

    ctx.lineCap =
      "round";


    for (const star of shootingStars) {

      const progress =
        star.life /
        star.maxLife;


      const fade =
        Math.sin(
          progress *
          Math.PI
        );


      const speed =
        Math.sqrt(
          star.vx * star.vx +
          star.vy * star.vy
        );


      const nx =
        star.vx /
        speed;

      const ny =
        star.vy /
        speed;


      const tail =
        star.length *
        (0.65 + fade * 0.35);


      const x2 =
        star.x -
        nx * tail;

      const y2 =
        star.y -
        ny * tail;


      const gradient =
        ctx.createLinearGradient(
          star.x,
          star.y,
          x2,
          y2
        );


      gradient.addColorStop(
        0,
        `rgba(255,255,255,${fade * star.brightness})`
      );

      gradient.addColorStop(
        0.15,
        `rgba(190,220,255,${fade * star.brightness * 0.7})`
      );

      gradient.addColorStop(
        1,
        "rgba(100,150,255,0)"
      );


      ctx.beginPath();

      ctx.moveTo(
        star.x,
        star.y
      );

      ctx.lineTo(
        x2,
        y2
      );


      ctx.strokeStyle =
        gradient;

      ctx.lineWidth =
        1.2 +
        fade * 1.4;

      ctx.stroke();


      /*
       * Bright head.
       */

      ctx.beginPath();

      ctx.arc(
        star.x,
        star.y,
        1.4 +
        fade * 1.8,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        `rgba(255,255,255,${fade * star.brightness})`;

      ctx.fill();
    }

    ctx.restore();
  }


  /* =======================================================
     DISK COORDINATES
     ======================================================= */

  function diskPoint(
    bh,
    radius,
    angle,
    frontOffset = 0
  ) {

    /*
     * Elliptical disk.
     */

    const x =
      Math.cos(angle) *
      radius;


    const y =
      Math.sin(angle) *
      radius *
      0.15;


    /*
     * Tilt the disk.
     */

    const cos =
      Math.cos(
        DISK_TILT
      );

    const sin =
      Math.sin(
        DISK_TILT
      );


    const rx =
      x * cos -
      y * sin;


    const ry =
      x * sin +
      y * cos;


    return {

      x:
        bh.x +
        rx,

      y:
        bh.y +
        ry +
        frontOffset

    };
  }


  /* =======================================================
     ACCRETION DISK GLOW
     ======================================================= */

  function drawDiskGlow(bh) {

    ctx.save();

    ctx.translate(
      bh.x,
      bh.y
    );

    ctx.rotate(
      DISK_TILT
    );

    ctx.scale(
      1,
      0.29
    );


    const glow =
      ctx.createRadialGradient(
        0,
        0,
        bh.radius * 0.7,
        0,
        0,
        bh.diskRadius
      );


    glow.addColorStop(
      0,
      "rgba(255,245,220,0.52)"
    );

    glow.addColorStop(
      0.12,
      "rgba(255,220,145,0.42)"
    );

    glow.addColorStop(
      0.28,
      "rgba(255,120,35,0.25)"
    );

    glow.addColorStop(
      0.58,
      "rgba(150,45,15,0.09)"
    );

    glow.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );


    ctx.fillStyle =
      glow;


    ctx.beginPath();

    ctx.arc(
      0,
      0,
      bh.diskRadius,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  }


  /* =======================================================
     DISK PARTICLES
     ======================================================= */

  function drawDiskParticles(
    bh,
    frontOnly
  ) {

    ctx.save();

    ctx.globalCompositeOperation =
      "lighter";


    for (const particle of diskParticles) {

      particle.angle +=
        particle.speed *
        0.006;


      /*
       * Determine whether this section of the disk
       * is visually in front of the black hole.
       */

      const depth =
        Math.sin(
          particle.angle
        );


      const isFront =
        depth > 0;


      if (
        isFront !==
        frontOnly
      ) {

        continue;
      }


      const point =
        diskPoint(
          bh,
          particle.radius,
          particle.angle
        );


      /*
       * Relativistic-style brightness asymmetry.
       *
       * One side of the disk becomes substantially
       * brighter, similar to the Doppler beaming
       * seen in black-hole visualizations.
       */

      const doppler =
        0.35 +
        0.65 *
        Math.max(
          0,
          Math.sin(
            particle.angle +
            0.8
          )
        );


      const alpha =
        particle.alpha *
        (0.55 + doppler);


      const heat =
        particle.heat;


      let r;
      let g;
      let b;


      if (
        heat >
        0.68
      ) {

        r = 255;
        g = 220;
        b = 150;

      } else if (
        heat >
        0.35
      ) {

        r = 255;
        g = 120;
        b = 35;

      } else {

        r = 175;
        g = 45;
        b = 18;
      }


      ctx.beginPath();

      ctx.arc(
        point.x,
        point.y,
        particle.size *
        (0.75 + heat * 1.4),
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        `rgba(${r},${g},${b},${alpha})`;

      ctx.fill();
    }


    ctx.restore();
  }


  /* =======================================================
     DISK STREAMS
     ======================================================= */

  function drawDiskStreams(bh) {

    ctx.save();

    ctx.translate(
      bh.x,
      bh.y
    );

    ctx.rotate(
      DISK_TILT
    );

    ctx.scale(
      1.2,
      0.10
    );

    ctx.globalCompositeOperation =
      "lighter";


    /*
     * Create persistent stream particles once.
     */

    if (
      !drawDiskStreams.streams
    ) {

      drawDiskStreams.streams =
        [];


      for (
        let i = 0;
        i < 95;
        i++
      ) {

        drawDiskStreams.streams.push({

          start:
            Math.random() *
            Math.PI *
            3,

          length:
            0.12 +
            Math.random() *
            0.33,

          speed:
            0.02 +
            Math.random() *
            0.0

        });
      }
    }


    for (
      let i = 0;
      i < 95;
      i++
    ) {

      const stream =
        drawDiskStreams.streams[i];


      /*
       * Smooth continuous movement.
       */

      stream.start +=
        stream.speed;


      const radius =
        bh.radius * 1.05 +
        (i / 95) *
        bh.radius * 3.25;


      const start =
        stream.start;


      const length =
        stream.length;


      ctx.beginPath();

      ctx.arc(
        0,
        0,
        radius,
        start,
        start + length
      );


      const heat =
        1 -
        (
          radius /
          (
            bh.radius *
            25.4
          )
        );


      const alpha =
        Math.max(
          0.02,
          heat * .80
        );


      ctx.strokeStyle =
        `rgba(255,${130 + heat * 100},${40 + heat * 130},${alpha})`;


      ctx.lineWidth =
        0.6 +
        heat * 2.9;


      ctx.stroke();

    }

    ctx.restore();

  }


  /* =======================================================
     EVENT HORIZON
     ======================================================= */

  function drawEventHorizon(bh) {

    /*
     * Deep gravitational glow around the horizon.
     */

    const halo =
      ctx.createRadialGradient(
        bh.x,
        bh.y,
        bh.radius * 0.65,
        bh.x,
        bh.y,
        bh.radius * 1.55
      );


    halo.addColorStop(
      0,
      "rgba(0,0,0,1)"
    );

    halo.addColorStop(
      0.48,
      "rgba(0,0,0,1)"
    );

    halo.addColorStop(
      0.72,
      "rgba(8,6,5,0.92)"
    );

    halo.addColorStop(
      0.88,
      "rgba(255,150,65,0.10)"
    );

    halo.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );


    ctx.beginPath();

    ctx.arc(
      bh.x,
      bh.y,
      bh.radius * 1.55,
      0,
      Math.PI * 2
    );


    ctx.fillStyle =
      halo;

    ctx.fill();


    /*
     * Absolute black center.
     */

    ctx.beginPath();

    ctx.arc(
      bh.x,
      bh.y,
      bh.radius,
      0,
      Math.PI * 2
    );


    ctx.fillStyle =
      "#000";

    ctx.fill();
  }


  /* =======================================================
     PHOTON RING
     ======================================================= */

  function drawPhotonRing(bh) {

    ctx.save();

    ctx.globalCompositeOperation =
      "lighter";


    /*
     * Main photon ring.
     */

    const ring =
      ctx.createRadialGradient(
        bh.x,
        bh.y,
        bh.photonRadius * 0.82,
        bh.x,
        bh.y,
        bh.photonRadius * 1.25
      );


    ring.addColorStop(
      0,
      "rgba(0,0,0,0)"
    );

    ring.addColorStop(
      0.48,
      "rgba(255,220,155,0.0)"
    );

    ring.addColorStop(
      0.66,
      "rgba(255,220,150,0.88)"
    );

    ring.addColorStop(
      0.76,
      "rgba(255,150,55,0.38)"
    );

    ring.addColorStop(
      0.95,
      "rgba(255,90,20,0)"
    );


    ctx.beginPath();

    ctx.arc(
      bh.x,
      bh.y,
      bh.photonRadius * 1.2,
      0,
      Math.PI * 2
    );


    ctx.fillStyle =
      ring;

    ctx.fill();


    /*
     * Thin sharp photon ring.
     */

    ctx.beginPath();

    ctx.arc(
      bh.x,
      bh.y,
      bh.photonRadius,
      0,
      Math.PI * 2
    );


    ctx.strokeStyle =
      "rgba(255,225,175,0.9)";

    ctx.lineWidth =
      1.2;

    ctx.stroke();


    ctx.restore();
  }


  /* =======================================================
     GRAVITATIONAL LENSING
     ======================================================= */

  function drawLensing(bh) {

    ctx.save();

    ctx.globalCompositeOperation =
      "lighter";


    /*
     * Thin warped arcs above and below the horizon.
     */

    for (
      let i = 0;
      i < 18;
      i++
    ) {

      const radius =
        bh.radius * 1.25 +
        i * 2.2;


      const arc =
        0.55 -
        i * 0.01;


      ctx.beginPath();

      ctx.ellipse(
        bh.x,
        bh.y,
        radius * 1.7,
        radius * 0.42,
        DISK_TILT,
        Math.PI * 0.12,
        Math.PI * 0.88
      );


      ctx.strokeStyle =
        `rgba(255,190,100,${0.012 + (18 - i) * 0.002})`;


      ctx.lineWidth =
        1;


      ctx.stroke();
    }


    ctx.restore();
  }


  /* =======================================================
     STATIC BLACK HOLE CACHE
     ======================================================= */

  function renderStaticBlackHole() {

    const bh =
      getBlackHole();


    /*
     * Resize the offscreen canvases.
     */

    staticUnderCanvas.width =
      width * dpr;

    staticUnderCanvas.height =
      height * dpr;


    staticMiddleCanvas.width =
      width * dpr;

    staticMiddleCanvas.height =
      height * dpr;


    staticTopCanvas.width =
      width * dpr;

    staticTopCanvas.height =
      height * dpr;


    /*
     * Reset transforms.
     */

    staticUnderCtx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    staticMiddleCtx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    staticTopCtx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );


    /*
     * Clear all layers.
     */

    staticUnderCtx.clearRect(
      0,
      0,
      width,
      height
    );

    staticMiddleCtx.clearRect(
      0,
      0,
      width,
      height
    );

    staticTopCtx.clearRect(
      0,
      0,
      width,
      height
    );


    /* =====================================================
       UNDER LAYER
       Atmosphere + disk glow
       ===================================================== */

    const atmosphere =
      staticUnderCtx.createRadialGradient(
        bh.x,
        bh.y,
        bh.radius,
        bh.x,
        bh.y,
        bh.diskRadius * 3.5
      );


    atmosphere.addColorStop(
      0,
      "rgba(255,150,60,0.06)"
    );

    atmosphere.addColorStop(
      0.35,
      "rgba(170,65,20,0.025)"
    );

    atmosphere.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );


    staticUnderCtx.beginPath();

    staticUnderCtx.arc(
      bh.x,
      bh.y,
      bh.diskRadius * 10.5,
      0,
      Math.PI * 2
    );


    staticUnderCtx.fillStyle =
      atmosphere;

    staticUnderCtx.fill();


    /*
     * Disk glow.
     */

    staticUnderCtx.save();

    staticUnderCtx.translate(
      bh.x,
      bh.y
    );

    staticUnderCtx.rotate(
      DISK_TILT
    );

    staticUnderCtx.scale(
      1,
      0.29
    );


    const glow =
      staticUnderCtx.createRadialGradient(
        0,
        0,
        bh.radius * 0.7,
        0,
        0,
        bh.diskRadius
      );


    glow.addColorStop(
      0,
      "rgba(255,245,220,0.52)"
    );

    glow.addColorStop(
      0.12,
      "rgba(255,220,145,0.42)"
    );

    glow.addColorStop(
      0.28,
      "rgba(255,120,35,0.25)"
    );

    glow.addColorStop(
      0.58,
      "rgba(150,45,15,0.09)"
    );

    glow.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );


    staticUnderCtx.fillStyle =
      glow;


    staticUnderCtx.beginPath();

    staticUnderCtx.arc(
      0,
      0,
      bh.diskRadius,
      0,
      Math.PI * 2
    );


    staticUnderCtx.fill();

    staticUnderCtx.restore();


    /* =====================================================
       MIDDLE LAYER
       Lensing + event horizon
       ===================================================== */

    staticMiddleCtx.save();

    staticMiddleCtx.globalCompositeOperation =
      "lighter";


    /*
     * Gravitational lensing.
     */

    for (
      let i = 0;
      i < 18;
      i++
    ) {

      const radius =
        bh.radius * 1.25 +
        i * 2.2;


      staticMiddleCtx.beginPath();

      staticMiddleCtx.ellipse(
        bh.x,
        bh.y,
        radius * 1.7,
        radius * 0.42,
        DISK_TILT,
        Math.PI * 0.12,
        Math.PI * 0.88
      );


      staticMiddleCtx.strokeStyle =
        `rgba(255,190,100,${0.012 + (18 - i) * 0.002})`;


      staticMiddleCtx.lineWidth =
        1;


      staticMiddleCtx.stroke();
    }


    staticMiddleCtx.restore();


    /*
     * Event horizon glow.
     */

    const halo =
      staticMiddleCtx.createRadialGradient(
        bh.x,
        bh.y,
        bh.radius * 0.65,
        bh.x,
        bh.y,
        bh.radius * 1.55
      );


    halo.addColorStop(
      0,
      "rgba(0,0,0,1)"
    );

    halo.addColorStop(
      0.48,
      "rgba(0,0,0,1)"
    );

    halo.addColorStop(
      0.72,
      "rgba(8,6,5,0.92)"
    );

    halo.addColorStop(
      0.88,
      "rgba(255,150,65,0.10)"
    );

    halo.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );


    staticMiddleCtx.beginPath();

    staticMiddleCtx.arc(
      bh.x,
      bh.y,
      bh.radius * 1.55,
      0,
      Math.PI * 2
    );


    staticMiddleCtx.fillStyle =
      halo;

    staticMiddleCtx.fill();


    /*
     * Absolute black center.
     */

    staticMiddleCtx.beginPath();

    staticMiddleCtx.arc(
      bh.x,
      bh.y,
      bh.radius,
      0,
      Math.PI * 2
    );


    staticMiddleCtx.fillStyle =
      "#000";

    staticMiddleCtx.fill();


    /* =====================================================
       TOP LAYER
       Photon ring
       ===================================================== */

    staticTopCtx.save();

    staticTopCtx.globalCompositeOperation =
      "lighter";


    const ring =
      staticTopCtx.createRadialGradient(
        bh.x,
        bh.y,
        bh.photonRadius * 0.82,
        bh.x,
        bh.y,
        bh.photonRadius * 1.25
      );


    ring.addColorStop(
      0,
      "rgba(0,0,0,0)"
    );

    ring.addColorStop(
      0.48,
      "rgba(255,220,155,0.0)"
    );

    ring.addColorStop(
      0.66,
      "rgba(255,220,150,0.88)"
    );

    ring.addColorStop(
      0.76,
      "rgba(255,150,55,0.38)"
    );

    ring.addColorStop(
      0.95,
      "rgba(255,90,20,0)"
    );


    staticTopCtx.beginPath();

    staticTopCtx.arc(
      bh.x,
      bh.y,
      bh.photonRadius * 1.2,
      0,
      Math.PI * 2
    );


    staticTopCtx.fillStyle =
      ring;

    staticTopCtx.fill();


    /*
     * Thin sharp photon ring.
     */

    staticTopCtx.beginPath();

    staticTopCtx.arc(
      bh.x,
      bh.y,
      bh.photonRadius,
      0,
      Math.PI * 2
    );


    staticTopCtx.strokeStyle =
      "rgba(255,225,175,0.9)";

    staticTopCtx.lineWidth =
      1.2;

    staticTopCtx.stroke();


    staticTopCtx.restore();
  }


  /* =======================================================
     DRAW BLACK HOLE
     ======================================================= */

  function drawBlackHole() {

    const bh =
      getBlackHole();


    /*
     * -----------------------------------------------------
     * STATIC UNDER LAYER
     *
     * Atmosphere + disk glow are copied from cache.
     * -----------------------------------------------------
     */

    ctx.drawImage(
      staticUnderCanvas,
      0,
      0,
      width,
      height
    );


    /*
     * -----------------------------------------------------
     * ANIMATED STREAMS
     * -----------------------------------------------------
     */

    drawDiskStreams(bh);


    /*
     * -----------------------------------------------------
     * BACK HALF OF ACCRETION DISK
     * -----------------------------------------------------
     */

    drawDiskParticles(
      bh,
      false
    );


    /*
     * -----------------------------------------------------
     * STATIC MIDDLE LAYER
     *
     * Lensing + event horizon.
     *
     * This remains between the back and front particle
     * layers exactly like the original version.
     * -----------------------------------------------------
     */

    ctx.drawImage(
      staticMiddleCanvas,
      0,
      0,
      width,
      height
    );


    /*
     * -----------------------------------------------------
     * FRONT HALF OF ACCRETION DISK
     * -----------------------------------------------------
     */

    drawDiskParticles(
      bh,
      true
    );


    /*
     * -----------------------------------------------------
     * STATIC TOP LAYER
     *
     * Photon ring remains on top of everything.
     * -----------------------------------------------------
     */

    ctx.drawImage(
      staticTopCanvas,
      0,
      0,
      width,
      height
    );
  }


     /* =======================================================
     ANIMATION LOOP
     ======================================================= */

  function animate(now) {

  if (!isVisible) {

    requestAnimationFrame(
      animate
    );

    return;
  }


  if (
    now - lastFrameTime <
    FRAME_INTERVAL
  ) {

    requestAnimationFrame(
      animate
    );

    return;
  }

  // everything else stays exactly the same

  const elapsed =
    now - lastFrameTime;

  lastFrameTime =
    now;

  const dt =
    Math.min(
      elapsed / 1000,
      0.033
    );

  lastTime =
    now;

  drawBackground(now);

  updateShootingStars(dt);

  drawBlackHole();

  drawShootingStars();

  requestAnimationFrame(
    animate
  );
}

  /* =======================================================
   EVENTS
   ======================================================= */

function checkVisibility() {

  const rect =
    canvas.getBoundingClientRect();

  isVisible =
    rect.bottom > 0 &&
    rect.top < window.innerHeight;
}


window.addEventListener(
  "resize",
  () => {

    resize();
    checkVisibility();

  }
);


window.addEventListener(
  "scroll",
  checkVisibility,
  {
    passive: true
  }
);


/* =======================================================
   INIT
   ======================================================= */

resize();

checkVisibility();

requestAnimationFrame(
  animate
);


  /* =======================================================
     INIT
     ======================================================= */

  resize();

  console.log(
  "BWX BLACK HOLE:",
  canvas.getBoundingClientRect(),
  "viewport:",
  window.innerHeight
);

  requestAnimationFrame(
    animate
  );

})();



// /* =========================================================
//    BWX CONTACT BLACK HOLE
//    ========================================================= */

// (() => {

//   const canvas = document.getElementById("bwx-blackhole-canvas");

//   if (!canvas) return;

//   const ctx = canvas.getContext("2d");

//   let width = 0;
//   let height = 0;
//   let dpr = 1;

//   let stars = [];
//   let shootingStars = [];
//   let diskParticles = [];

//   let lastTime = performance.now();
//   let shootingStarTimer = 0;


//   /* =======================================================
//      CONFIG
//      ======================================================= */

//   const STAR_COUNT = 2500;
//   const DISK_PARTICLE_COUNT = 2500;

//   const BLACK_HOLE_X = 0.735;
//   const BLACK_HOLE_Y = 0.505;

//   const DISK_TILT = -0.38;


//   /* =======================================================
//      RESIZE
//      ======================================================= */

//   function resize() {

//     const rect = canvas.getBoundingClientRect();

//     dpr = Math.min(window.devicePixelRatio || 1, 2);

//     width = rect.width;
//     height = rect.height;

//     canvas.width = width * dpr;
//     canvas.height = height * dpr;

//     ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

//     createStars();
//     createDiskParticles();
//   }


//   /* =======================================================
//      STAR FIELD
//      ======================================================= */

//   function createStars() {

//     stars = [];

//     for (let i = 0; i < STAR_COUNT; i++) {

//       stars.push({

//         x: Math.random(),
//         y: Math.random(),

//         radius:
//           Math.random() < 0.9
//             ? Math.random() * 0.9 + 0.15
//             : Math.random() * 1.7 + 0.5,

//         baseAlpha:
//           Math.random() * 0.55 + 0.18,

//         twinkleSpeed:
//           Math.random() * 2.5 + 0.5,

//         phase:
//           Math.random() * Math.PI * 2

//       });
//     }
//   }


//   /* =======================================================
//      DISK PARTICLES
//      ======================================================= */

//   function createDiskParticles() {

//     diskParticles = [];

//     for (let i = 0; i < DISK_PARTICLE_COUNT; i++) {

//       const angle = Math.random() * Math.PI * 2;

//       /*
//        * Heavily weighted toward the inner disk.
//        */
//       const radius =
//         Math.pow(Math.random(), .26) * 500 + 20;

//       diskParticles.push({

//         angle,
//         radius,

//         speed:
//           (0.35 + Math.random() * 0.45) /
//           Math.pow(radius / 100, 0.45),

//         size:
//           Math.random() * 1.4 + 0.25,

//         alpha:
//           Math.random() * 0.65 + 0.15,

//         heat:
//           Math.max(
//             0,
//             1 - radius / 600
//           ),

//         offset:
//           (Math.random() - 0.5) * 0.9

//       });
//     }
//   }


//   /* =======================================================
//      BLACK HOLE GEOMETRY
//      ======================================================= */

//   function getBlackHole() {

//     const minDimension = Math.min(width, height);

//     const radius = Math.max(
//       68,
//       Math.min(
//         108,
//         minDimension * 0.105
//       )
//     );

//     return {

//       x: width * BLACK_HOLE_X,
//       y: height * BLACK_HOLE_Y,

//       radius,

//       photonRadius: radius * 1.14,

//       diskRadius: radius * 8.5

//     };
//   }


//   /* =======================================================
//      BACKGROUND
//      ======================================================= */

//   function drawBackground(time) {

//     ctx.clearRect(0, 0, width, height);

//     /*
//      * Extremely subtle deep-space gradient.
//      */

//     const bg = ctx.createRadialGradient(
//       width * 0.73,
//       height * 0.5,
//       0,
//       width * 0.73,
//       height * 0.5,
//       width * 0.7
//     );

//     bg.addColorStop(0, "rgba(35, 18, 8, 0.18)");
//     bg.addColorStop(0.3, "rgba(13, 17, 29, 0.08)");
//     bg.addColorStop(1, "rgba(0, 0, 0, 0)");

//     ctx.fillStyle = bg;

//     ctx.fillRect(0, 0, width, height);


//     /*
//      * Stars.
//      */

//     for (const star of stars) {

//       const pulse =
//         0.5 +
//         0.5 *
//         Math.sin(
//           time * 0.001 * star.twinkleSpeed +
//           star.phase
//         );

//       const alpha =
//         star.baseAlpha *
//         (0.55 + pulse * 0.75);

//       ctx.beginPath();

//       ctx.arc(
//         star.x * width,
//         star.y * height,
//         star.radius,
//         0,
//         Math.PI * 2
//       );

//       ctx.fillStyle =
//         `rgba(210,225,255,${alpha})`;

//       ctx.fill();
//     }
//   }


//   /* =======================================================
//      SHOOTING STARS
//      ======================================================= */

//   function spawnShootingStar() {

//     /*
//      * Mostly enter from upper/right areas and travel
//      * diagonally across the scene.
//      */

//     const fromTop =
//       Math.random() < 0.7;

//     const x =
//       fromTop
//         ? Math.random() * width
//         : width + 30;

//     const y =
//       fromTop
//         ? -30
//         : Math.random() * height * 0.55;

//     const angle =
//       Math.PI * (0.35 + Math.random() * 0.16);

//     const speed =
//       500 + Math.random() * 500;

//     shootingStars.push({

//       x,
//       y,

//       vx: Math.cos(angle) * speed,
//       vy: Math.sin(angle) * speed,

//       life: 0,

//       maxLife:
//         0.55 + Math.random() * 0.7,

//       length:
//         90 + Math.random() * 170,

//       brightness:
//         0.45 + Math.random() * 0.55

//     });
//   }


//   function updateShootingStars(dt) {

//     shootingStarTimer -= dt;

//     if (shootingStarTimer <= 0) {

//       /*
//        * Randomized timing prevents obvious repetition.
//        */

//       if (Math.random() < 0.8) {
//         spawnShootingStar();
//       }

//       shootingStarTimer =
//         1.8 + Math.random() * 4.5;
//     }


//     for (let i = shootingStars.length - 1; i >= 0; i--) {

//       const star = shootingStars[i];

//       star.life += dt;

//       star.x += star.vx * dt;
//       star.y += star.vy * dt;

//       if (
//         star.life > star.maxLife ||
//         star.x < -400 ||
//         star.y > height + 400
//       ) {

//         shootingStars.splice(i, 1);
//       }
//     }
//   }


//   function drawShootingStars() {

//     ctx.save();

//     ctx.lineCap = "round";

//     for (const star of shootingStars) {

//       const progress =
//         star.life / star.maxLife;

//       const fade =
//         Math.sin(progress * Math.PI);

//       const speed =
//         Math.sqrt(
//           star.vx * star.vx +
//           star.vy * star.vy
//         );

//       const nx = star.vx / speed;
//       const ny = star.vy / speed;

//       const tail =
//         star.length *
//         (0.65 + fade * 0.35);

//       const x2 =
//         star.x - nx * tail;

//       const y2 =
//         star.y - ny * tail;


//       const gradient =
//         ctx.createLinearGradient(
//           star.x,
//           star.y,
//           x2,
//           y2
//         );

//       gradient.addColorStop(
//         0,
//         `rgba(255,255,255,${fade * star.brightness})`
//       );

//       gradient.addColorStop(
//         0.15,
//         `rgba(190,220,255,${fade * star.brightness * 0.7})`
//       );

//       gradient.addColorStop(
//         1,
//         "rgba(100,150,255,0)"
//       );


//       ctx.beginPath();

//       ctx.moveTo(star.x, star.y);

//       ctx.lineTo(x2, y2);

//       ctx.strokeStyle = gradient;

//       ctx.lineWidth =
//         1.2 + fade * 1.4;

//       ctx.stroke();


//       /*
//        * Bright head.
//        */

//       ctx.beginPath();

//       ctx.arc(
//         star.x,
//         star.y,
//         1.4 + fade * 1.8,
//         0,
//         Math.PI * 2
//       );

//       ctx.fillStyle =
//         `rgba(255,255,255,${fade * star.brightness})`;

//       ctx.fill();
//     }

//     ctx.restore();
//   }


//   /* =======================================================
//      DISK COORDINATES
//      ======================================================= */

//   function diskPoint(
//     bh,
//     radius,
//     angle,
//     frontOffset = 0
//   ) {

//     /*
//      * Elliptical disk.
//      */

//     const x =
//       Math.cos(angle) * radius;

//     const y =
//       Math.sin(angle) *
//       radius *
//       0.15;

//     /*
//      * Tilt the disk.
//      */

//     const cos = Math.cos(DISK_TILT);
//     const sin = Math.sin(DISK_TILT);

//     const rx =
//       x * cos - y * sin;

//     const ry =
//       x * sin + y * cos;

//     return {

//       x: bh.x + rx,
//       y: bh.y + ry + frontOffset

//     };
//   }


//   /* =======================================================
//      ACCRETION DISK GLOW
//      ======================================================= */

//   function drawDiskGlow(bh) {

//     ctx.save();

//     ctx.translate(bh.x, bh.y);

//     ctx.rotate(DISK_TILT);

//     ctx.scale(1, 0.29);


//     const glow =
//       ctx.createRadialGradient(
//         0,
//         0,
//         bh.radius * 0.7,
//         0,
//         0,
//         bh.diskRadius
//       );

//     glow.addColorStop(
//       0,
//       "rgba(255,245,220,0.52)"
//     );

//     glow.addColorStop(
//       0.12,
//       "rgba(255,220,145,0.42)"
//     );

//     glow.addColorStop(
//       0.28,
//       "rgba(255,120,35,0.25)"
//     );

//     glow.addColorStop(
//       0.58,
//       "rgba(150,45,15,0.09)"
//     );

//     glow.addColorStop(
//       1,
//       "rgba(0,0,0,0)"
//     );

//     ctx.fillStyle = glow;

//     ctx.beginPath();

//     ctx.arc(
//       0,
//       0,
//       bh.diskRadius,
//       0,
//       Math.PI * 2
//     );

//     ctx.fill();

//     ctx.restore();
//   }


//   /* =======================================================
//      DISK PARTICLES
//      ======================================================= */

//   function drawDiskParticles(
//     bh,
//     frontOnly
//   ) {

//     ctx.save();

//     ctx.globalCompositeOperation =
//       "lighter";


//     for (const particle of diskParticles) {

//       particle.angle +=
//         particle.speed * 0.006;


//       /*
//        * Determine whether this section of the disk
//        * is visually in front of the black hole.
//        */

//       const depth =
//         Math.sin(
//           particle.angle
//         );


//       const isFront =
//         depth > 0;


//       if (isFront !== frontOnly) {
//         continue;
//       }


//       const point =
//         diskPoint(
//           bh,
//           particle.radius,
//           particle.angle
//         );


//       /*
//        * Relativistic-style brightness asymmetry.
//        *
//        * One side of the disk becomes substantially
//        * brighter, similar to the Doppler beaming
//        * seen in black-hole visualizations.
//        */

//       const doppler =
//         0.35 +
//         0.65 *
//         Math.max(
//           0,
//           Math.sin(
//             particle.angle + 0.8
//           )
//         );


//       const alpha =
//         particle.alpha *
//         (0.55 + doppler);


//       const heat =
//         particle.heat;


//       let r;
//       let g;
//       let b;


//       if (heat > 0.68) {

//         r = 255;
//         g = 220;
//         b = 150;

//       } else if (heat > 0.35) {

//         r = 255;
//         g = 120;
//         b = 35;

//       } else {

//         r = 175;
//         g = 45;
//         b = 18;
//       }


//       ctx.beginPath();

//       ctx.arc(
//         point.x,
//         point.y,
//         particle.size *
//         (0.75 + heat * 1.4),
//         0,
//         Math.PI * 2
//       );

//       ctx.fillStyle =
//         `rgba(${r},${g},${b},${alpha})`;

//       ctx.fill();
//     }


//     ctx.restore();
//   }


//   /* =======================================================
//    DISK STREAMS
//    ======================================================= */

//   function drawDiskStreams(bh) {

//     ctx.save();

//     ctx.translate(bh.x, bh.y);

//     ctx.rotate(DISK_TILT);

//     ctx.scale(1.2, 0.10);

//     ctx.globalCompositeOperation =
//       "lighter";


//     /*
//      * Create persistent stream particles once.
//      */

//     if (!drawDiskStreams.streams) {

//       drawDiskStreams.streams = [];

//       for (let i = 0; i < 95; i++) {

//         drawDiskStreams.streams.push({

//           start:
//             Math.random() * Math.PI * 3,

//           length:
//             0.12 +
//             Math.random() * 0.33,

//           speed:
//             0.02 +
//             Math.random() * 0.0

//         });

//       }

//     }


//     for (let i = 0; i < 95; i++) {

//       const stream =
//         drawDiskStreams.streams[i];


//       /*
//        * Smooth continuous movement.
//        */

//       stream.start += stream.speed;


//       const radius =
//         bh.radius * 1.05 +
//         (i / 95) *
//         bh.radius * 3.25;

//       const start =
//         stream.start;

//       const length =
//         stream.length;


//       ctx.beginPath();

//       ctx.arc(
//         0,
//         0,
//         radius,
//         start,
//         start + length
//       );


//       const heat =
//         1 -
//         (radius /
//           (bh.radius * 25.4));


//       const alpha =
//         Math.max(
//           0.02,
//           heat * .80
//         );


//       ctx.strokeStyle =
//         `rgba(255,${130 + heat * 100},${40 + heat * 130},${alpha})`;

//       ctx.lineWidth =
//         0.6 +
//         heat * 2.9;

//       ctx.stroke();

//     }

//     ctx.restore();

//   }


//   /* =======================================================
//      EVENT HORIZON
//      ======================================================= */

//   function drawEventHorizon(bh) {

//     /*
//      * Deep gravitational glow around the horizon.
//      */

//     const halo =
//       ctx.createRadialGradient(
//         bh.x,
//         bh.y,
//         bh.radius * 0.65,
//         bh.x,
//         bh.y,
//         bh.radius * 1.55
//       );

//     halo.addColorStop(
//       0,
//       "rgba(0,0,0,1)"
//     );

//     halo.addColorStop(
//       0.48,
//       "rgba(0,0,0,1)"
//     );

//     halo.addColorStop(
//       0.72,
//       "rgba(8,6,5,0.92)"
//     );

//     halo.addColorStop(
//       0.88,
//       "rgba(255,150,65,0.10)"
//     );

//     halo.addColorStop(
//       1,
//       "rgba(0,0,0,0)"
//     );


//     ctx.beginPath();

//     ctx.arc(
//       bh.x,
//       bh.y,
//       bh.radius * 1.55,
//       0,
//       Math.PI * 2
//     );

//     ctx.fillStyle = halo;

//     ctx.fill();


//     /*
//      * Absolute black center.
//      */

//     ctx.beginPath();

//     ctx.arc(
//       bh.x,
//       bh.y,
//       bh.radius,
//       0,
//       Math.PI * 2
//     );

//     ctx.fillStyle = "#000";

//     ctx.fill();
//   }


//   /* =======================================================
//      PHOTON RING
//      ======================================================= */

//   function drawPhotonRing(bh) {

//     ctx.save();

//     ctx.globalCompositeOperation =
//       "lighter";


//     /*
//      * Main photon ring.
//      */

//     const ring =
//       ctx.createRadialGradient(
//         bh.x,
//         bh.y,
//         bh.photonRadius * 0.82,
//         bh.x,
//         bh.y,
//         bh.photonRadius * 1.25
//       );

//     ring.addColorStop(
//       0,
//       "rgba(0,0,0,0)"
//     );

//     ring.addColorStop(
//       0.48,
//       "rgba(255,220,155,0.0)"
//     );

//     ring.addColorStop(
//       0.66,
//       "rgba(255,220,150,0.88)"
//     );

//     ring.addColorStop(
//       0.76,
//       "rgba(255,150,55,0.38)"
//     );

//     ring.addColorStop(
//       0.95,
//       "rgba(255,90,20,0)"
//     );


//     ctx.beginPath();

//     ctx.arc(
//       bh.x,
//       bh.y,
//       bh.photonRadius * 1.2,
//       0,
//       Math.PI * 2
//     );

//     ctx.fillStyle = ring;

//     ctx.fill();


//     /*
//      * Thin sharp photon ring.
//      */

//     ctx.beginPath();

//     ctx.arc(
//       bh.x,
//       bh.y,
//       bh.photonRadius,
//       0,
//       Math.PI * 2
//     );

//     ctx.strokeStyle =
//       "rgba(255,225,175,0.9)";

//     ctx.lineWidth = 1.2;

//     ctx.stroke();


//     ctx.restore();
//   }


//   /* =======================================================
//      GRAVITATIONAL LENSING
//      * ======================================================= */

//   function drawLensing(bh) {

//     ctx.save();

//     ctx.globalCompositeOperation =
//       "lighter";


//     /*
//      * Thin warped arcs above and below the horizon.
//      */

//     for (let i = 0; i < 18; i++) {

//       const radius =
//         bh.radius * 1.25 +
//         i * 2.2;

//       const arc =
//         0.55 -
//         i * 0.01;


//       ctx.beginPath();

//       ctx.ellipse(
//         bh.x,
//         bh.y,
//         radius * 1.7,
//         radius * 0.42,
//         DISK_TILT,
//         Math.PI * 0.12,
//         Math.PI * 0.88
//       );

//       ctx.strokeStyle =
//         `rgba(255,190,100,${0.012 + (18 - i) * 0.002})`;

//       ctx.lineWidth = 1;

//       ctx.stroke();
//     }


//     ctx.restore();
//   }


//   /* =======================================================
//      DRAW BLACK HOLE
//      ======================================================= */

//   function drawBlackHole() {

//     const bh =
//       getBlackHole();


//     /*
//      * Large atmospheric glow.
//      */

//     const atmosphere =
//       ctx.createRadialGradient(
//         bh.x,
//         bh.y,
//         bh.radius,
//         bh.x,
//         bh.y,
//         bh.diskRadius * 3.5
//       );

//     atmosphere.addColorStop(
//       0,
//       "rgba(255,150,60,0.06)"
//     );

//     atmosphere.addColorStop(
//       0.35,
//       "rgba(170,65,20,0.025)"
//     );

//     atmosphere.addColorStop(
//       1,
//       "rgba(0,0,0,0)"
//     );

//     ctx.beginPath();

//     ctx.arc(
//       bh.x,
//       bh.y,
//       bh.diskRadius * 10.5,
//       0,
//       Math.PI * 2
//     );

//     ctx.fillStyle = atmosphere;

//     ctx.fill();


//     /*
//      * Disk glow.
//      */

//     drawDiskGlow(bh);


//     /*
//      * Back half of accretion disk.
//      */

//     drawDiskStreams(bh);

//     drawDiskParticles(
//       bh,
//       false
//     );


//     /*
//      * Lensing distortion.
//      */

//     drawLensing(bh);


//     /*
//      * Black hole itself.
//      */

//     drawEventHorizon(bh);


//     /*
//      * Front half of disk appears to cross
//      * over the event horizon.
//      */

//     drawDiskParticles(
//       bh,
//       true
//     );


//     /*
//      * Photon ring goes on top.
//      */

//     drawPhotonRing(bh);
//   }


//   /* =======================================================
//      ANIMATION LOOP
//      ======================================================= */

//   function animate(now) {

//     const dt =
//       Math.min(
//         (now - lastTime) / 1000,
//         0.033
//       );

//     lastTime = now;


//     drawBackground(now);

//     updateShootingStars(dt);

//     drawBlackHole();

//     drawShootingStars();


//     requestAnimationFrame(
//       animate
//     );
//   }


//   /* =======================================================
//      EVENTS
//      ======================================================= */

//   window.addEventListener(
//     "resize",
//     resize
//   );


//   /* =======================================================
//      INIT
//      ======================================================= */

//   resize();

//   requestAnimationFrame(
//     animate
//   );

// })();
