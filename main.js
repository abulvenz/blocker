import m from 'mithril';
import tagl from 'tagl-mithril';
import N from './numberToText';

// prettier-ignore
const { address, aside, footer, header, h1, h2, h3, h4, h5, h6, hgroup, main, nav, section, article, blockquote, dd, dir, div, dl, dt, figcaption, figure, hr, li, ol, p, pre, ul, a, abbr, b, bdi, bdo, br, cite, code, data, dfn, em, i, kdm, mark, q, rb, rp, rt, rtc, ruby, s, samp, small, span, strong, sub, sup, time, tt, u, wbr, area, audio, img, map, track, video, embed, iframe, noembed, object, param, picture, source, canvas, noscript, script, del, ins, caption, col, colgroup, table, tbody, td, tfoot, th, thead, tr, button, datalist, fieldset, form, formfield, input, label, legend, meter, optgroup, option, output, progress, select, textarea, details, dialog, menu, menuitem, summary, content, element, slot, template } = tagl(m);
const { svg, polygon, g, rect, text } = tagl(m);

const { keys, freeze } = Object;
const { trunc, random, min, round } = Math;

const range = (() => {
    const r = [];
    return (N) => {
        if (N > r.length) {
            for (let i = r.length; i < N; i++) {
                r.push(i);
            }
        }
        return r.slice(0, N);
    };
})();

const COLORS = freeze({
    GREEN2: 'green2',
    BLUE2: 'blue2',
    RED2: 'red2',
    GREEN: 'green',
    BLUE: 'blue',
    RED: 'red',
    BLACK: 'black',
    YELLOW: 'yellow',
});

const AV_COLORS = ['GREEN', 'BLUE', 'RED', /*"BLUE2", /*"GREEN2", "BLUE2", "RED2"*/ ];

const use = (v, fn) => fn(v);
const randomElement = (arr = []) => arr[trunc(random() * arr.length)];

const randomColor = () => randomElement(AV_COLORS);

const apply = p => f => f(p);

const slidingAverage = (N = 0, val = 0) => {
    return {
        add: v => {
            val = ((val * N) + v) / (N + 1);
            N += 1;
            return val;
        },
        value: () => val
    };
};

const createGame = (N, initial = false) => {
    let state = {
        key: 0,
        N,
        clicks: 0,
        score: 0,
        vScore: 0,
        stars: 2,
        lost: false,
        quality: 0,
        starActive: false,
        field: [],
    };
    const init = (N) => range(N * N).map((i) => ({ x: state.key++, n: 1, c: randomColor() }));

    state.field = init(N);

    if (initial) {
        (() => {
            try {
                const persistedState = localStorage.getItem("state");
                if (persistedState !== null) {
                    state = JSON.parse(persistedState);
                    console.log(state)
                }
            } catch (error) {
                // Silence;
            }
        })();
    }

    const qualityAverage = slidingAverage(state.clicks, state.quality);

    const save = () => localStorage.setItem("state", JSON.stringify(state));

    const coord = (idx) => ({ c: idx % state.N, r: trunc(idx / state.N) });
    const index = (p) => p.r * state.N + p.c;
    const onBoard = (p) => p.r >= 0 && p.c >= 0 && p.r < state.N && p.c < state.N;
    const upper = (p) => ({ r: p.r - 1, c: p.c });
    const lower = (p) => ({ r: p.r + 1, c: p.c });
    const left = (p) => ({ r: p.r, c: p.c - 1 });
    const right = (p) => ({ r: p.r, c: p.c + 1 });
    const neighbors = (p) => [upper, lower, left, right].map(apply(p)).filter(onBoard);
    const colorAt = (p) => state.field[index(p)].c;
    const countAt = (p) => state.field[index(p)].n;
    const contains = (arr, e) => arr.indexOf(e) >= 0;
    const flood = (p, connected = []) => {
        if (!contains(connected, index(p))) {
            connected.push(index(p));
            use(colorAt(p), (ownColor) =>
                neighbors(p)
                .filter((n) => colorAt(n) === ownColor)
                .forEach((n) => flood(n, connected))
            );
        }
        return connected;
    };
    const check = () => state.stars > 0 || range(state.N * state.N).some((idx) => flood(coord(idx)).length >= 3);
    const drop = (cb) => {
        let dropped = false;
        range(state.N * state.N)
            .map((i) => state.N * state.N - i - 1)
            .forEach((idx) => {
                if (colorAt(coord(idx)) === 'BLACK') {
                    dropped = true;
                    for (let c = idx; c >= 0; c = c - N) {
                        if (c >= N) {
                            state.field[c] = state.field[c - N];
                            state.field[c].x = state.key++;
                        } else {
                            state.field[c] = { n: 1, c: randomColor(), x: state.key++ };
                        }
                    }
                }
            });
        if (dropped) {
            setTimeout(() => drop(cb), 200);
        } else {
            state.lost = !check();
            save();
        }
        cb();
    };
    const click = (idx, cb) => {
        const connected = flood(coord(idx));
        if (connected.length < 3 && !state.starActive && state.stars > 0) {
            state.starActive = true;
            state.stars -= 1;
        }

        if (connected.length >= 3 || state.starActive) {
            state.clicks += 1;
            const count = connected
                .map(coord)
                .map(countAt)
                .reduce((acc, v) => acc + v, 0);
            const nScore = count * count + connected.length * connected.length;
            qualityAverage.add(nScore / connected.length);
            state.quality = qualityAverage.value();
            state.score = state.score + nScore;
            state.field[idx].n = count;
            connected
                .filter((i) => (state.field[idx].c === 'RED2' || state.starActive ? true : i != idx))
                .forEach(
                    (n) =>
                    (state.field[n] = {
                        c: 'BLACK',
                        n: 0,
                        x: state.field[n].x,
                    })
                );
            if (state.field[idx].n > 10) {
                state.field[idx].c = 'YELLOW';
                state.field[idx].x = state.key++;
            }
            if (state.field[idx].n > 100) {
                state.field[idx].c = 'BLUE2';
                state.field[idx].x = state.key++;
            }
            if (state.field[idx].n > 300) {
                state.field[idx].c = 'RED2';
                state.field[idx].x = state.key++;
            }

            state.stars += trunc(nScore / 10000);
            state.starActive = false;
            setTimeout(() => drop(cb), 200);
        }
    };

    const borderClasses = (idx) =>
        use(coord(idx), (p) =>
            use(colorAt(p), (ownColor) => [
                    { f: upper, s: 'top' },
                    { f: lower, s: 'bottom' },
                    { f: left, s: 'left' },
                    { f: right, s: 'right' },
                ]
                .filter((n) => use(n.f(p), (np) => onBoard(np) && colorAt(np) === ownColor))
                .map((n) => '.connected-' + n.s)
                .join(' ')
            )
        );

    return {
        N,
        field: () => state.field,
        score: () => state.score,
        vScore: (nn = state.vScore) => state.vScore = nn,
        stars: (nn = state.stars) => state.stars = nn,
        lost: () => state.lost,
        quality: () => qualityAverage.value(),
        starActive: () => state.starActive,
        coord,
        index,
        onBoard,
        flood,
        check,
        drop,
        click,
        borderClasses,
        activateStar: () => {
            if (!state.starActive && state.stars > 0) {
                state.starActive = true;
                state.stars--;
            }
        }
    };
};

let game = createGame(7, true);

const star = (vnode) => ({
    view: (vnode) => svg({ height: "25px", width: "25px", onclick: vnode.attrs.onclick }, [
        // rect({x:0,y:0,width:'25',height:'25',stroke:'lime'}),
        g({ transform: "scale(.125)" },
            polygon({
                "stroke-linecap": "round",
                "points": "100,10 40,198 190,78 10,78 160,198",
                "style": { "fill": "purple", "stroke": "purple", "stroke-width": "5", "fill-rule": "nonzero" }
            }),
            " Sorry, your browser does not support inline SVG. "
        )
    ])
});

const box = (vnode) => ({
    view: ({ attrs: { field, idx, onclick } }) =>
        div[COLORS[field.c]][game.borderClasses(idx)].box({
                onclick,
            },
            field.n > 1 && field.c !== "RED2" ? field.n : ''
        ),
});

let vScore = 0;

const scoreView = (vnode) => ({
    view: (vnode) => [small(vScore), " ", small(round(game.quality() * 100) / 100)],
});

const numberView = (vnode) => ({
    view: ({ attrs }) => div.margin(small.margin(N.numberToText(attrs.number, language)))
});

setInterval(() => {
    const add = ((vScore < game.score()) ? trunc((game.score() - vScore) / 2) : 0);
    if (add > 0) {
        vScore += add;
        m.redraw();
    }
}, 100);

const languageSelector = () => ({
    view: ({ attrs: { onchange, langs = ['en'] } }) => select.margin({ onchange: e => onchange(e.target.value) },
        langs.map(l => option({ value: l }, l))
    )
});

let language = 'en';

m.mount(document.body, {
    view: (vnode) => [
        div[game.starActive() ? "field-glow" : ""].field[`field${game.N}`](
            game.field().map((f, idx) =>
                m(box, {
                    key: f.x,
                    field: f,
                    idx,
                    onclick: () => game.click(idx, () => m.redraw()),
                })
            )
        ), !game.lost() ? null : h3.stars({ onclick: () => game = createGame(7) }, "Lost! Again?"),
        h1('Blocker ', m(scoreView), ' ', game.starActive() ? m(star) : null),
        m(numberView, { number: vScore }),
        m(languageSelector, {
            langs: ['en', 'de'],
            onchange: e => (language = e)
        }),
        div.stars(
            m(star, {
                onclick: () => game.activateStar()
            }, '*'), game.stars()),
    ],
});