import m from 'mithril';
import tagl from 'tagl-mithril';

// prettier-ignore
const { address, aside, footer, header, h1, h2, h3, h4, h5, h6, hgroup, main, nav, section, article, blockquote, dd, dir, div, dl, dt, figcaption, figure, hr, li, ol, p, pre, ul, a, abbr, b, bdi, bdo, br, cite, code, data, dfn, em, i, kdm, mark, q, rb, rp, rt, rtc, ruby, s, samp, small, span, strong, sub, sup, time, tt, u, wbr, area, audio, img, map, track, video, embed, iframe, noembed, object, param, picture, source, canvas, noscript, script, del, ins, caption, col, colgroup, table, tbody, td, tfoot, th, thead, tr, button, datalist, fieldset, form, formfield, input, label, legend, meter, optgroup, option, output, progress, select, textarea, details, dialog, menu, menuitem, summary, content, element, slot, template } = tagl(m);
const { svg, polygon, g, rect, text } = tagl(m);

const { keys, freeze } = Object;
const { trunc, random, min } = Math;

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

const AV_COLORS = ['GREEN', 'BLUE', 'RED', /*"GREEN2", "BLUE2", "RED2"*/ ];

let N = 7;
let field = [];
let score = 0;
let vScore = 0;
let key = 0;
let stars = 2;
let lost = false;
let quality = 0;
let starActive = false;
const use = (v, fn) => fn(v);
const randomElement = (arr = []) => arr[trunc(random() * arr.length)];
const coord = (idx) => ({ c: idx % N, r: trunc(idx / N) });
const index = (p) => p.r * N + p.c;
const onBoard = (p) => p.r >= 0 && p.c >= 0 && p.r < N && p.c < N;
const upper = (p) => ({ r: p.r - 1, c: p.c });
const lower = (p) => ({ r: p.r + 1, c: p.c });
const left = (p) => ({ r: p.r, c: p.c - 1 });
const right = (p) => ({ r: p.r, c: p.c + 1 });
const neighbors = (p) => [upper(p), lower(p), left(p), right(p)].filter(onBoard);
const colorAt = (p) => field[index(p)].c;
const countAt = (p) => field[index(p)].n;
const contains = (arr, e) => arr.indexOf(e) >= 0;
const flood = (p, connected = []) => {
    if (!contains(connected, index(p))) {
        connected.push(index(p));
        use(colorAt(p), (own) =>
            neighbors(p)
            .filter((n) => colorAt(n) === own)
            .forEach((n) => flood(n, connected))
        );
    }
    return connected;
};

const check = () => stars > 0 || range(N * N).some((idx) => flood(coord(idx)).length >= 3);

const drop = () => {
    let dropped = false;
    range(N * N)
        .map((i) => N * N - i - 1)
        .forEach((idx) => {
            if (colorAt(coord(idx)) === 'BLACK') {
                console.log(colorAt(coord(idx)));
                dropped = true;
                for (let c = idx; c >= 0; c = c - N) {
                    if (c >= N) {
                        field[c] = field[c - N];
                        field[c].x = key++;
                    } else {
                        field[c] = { n: 1, c: randomColor(), x: key++ };
                    }
                }
            }
        });
    m.redraw();
    if (dropped) {
        setTimeout(drop, 200);
    } else {
        console.log((lost = !check()));
    }
};

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

const click = (idx) => {
    const connected = flood(coord(idx));
    if (connected.length >= 3 || starActive) {
        const count = connected
            .map(coord)
            .map(countAt)
            .reduce((acc, v) => acc + v, 0);
        const nScore = count * count + connected.length * connected.length;
        score = score + nScore;
        field[idx].n = count;
        connected
            .filter((i) => (field[idx].c === 'YELLOW' || starActive ? true : i != idx))
            .forEach(
                (n) =>
                (field[n] = {
                    c: 'BLACK',
                    n: 0,
                    x: field[n].x,
                })
            );
        if (field[idx].n > 10) {
            field[idx].c = 'YELLOW';
            field[idx].x = key++;
        }
        stars += trunc(nScore / 10000);
        starActive = false;
        setTimeout(drop, 200);
    }
};

const randomColor = () => randomElement(AV_COLORS);
const init = (N) => range(N * N).map((i) => ({ x: key++, n: 1, c: randomColor() }));
const newGame = () => {
    score = 0;
    vScore = 0;
    stars = 2;
    lost = false;
    key = 0;
    quality = 0;
    starActive = false;
    field = init(N);
};

newGame();

console.log(field);

//setInterval(() => [newGame(), m.redraw()], 100)

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

const box = (vnode) => ({
    view: ({ attrs: { field, idx, onclick } }) =>
        div[COLORS[field.c]][borderClasses(idx)].box({
                onclick,
            },
            field.n > 1 ? field.n : ''
        ),
});

const scoreView = (vnode) => ({
    view: (vnode) => small(vScore),
});

setInterval(() => [(vScore += vScore < score ? trunc((score - vScore) / 2) : 0), m.redraw()], 100);

m.mount(document.body, {
    view: (vnode) => [div[starActive ? 'field-glow' : ''].field[`field${N}`](
            field.map((f, idx) =>
                m(box, {
                    key: f.x,
                    field: f,
                    idx,
                    onclick: () => click(idx),
                })
            )
        ), !lost ? null : h3.stars({ onclick: newGame }, "Lost! Again?"),
        h1('Blocker ', m(scoreView), ' ', starActive ? m(star) : null),
        div.stars(
            range(stars).map(stark => m(star, {
                onclick: () => {
                    if (!starActive) {
                        starActive = true;
                        stars--;
                    }
                }
            }, '*')))
    ],
});