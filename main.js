import m from 'mithril';
import tagl, { feDropShadow } from 'tagl-mithril';

// prettier-ignore
const { address, aside, footer, header, h1, h2, h3, h4, h5, h6, hgroup, main, nav, section, article, blockquote, dd, dir, div, dl, dt, figcaption, figure, hr, li, ol, p, pre, ul, a, abbr, b, bdi, bdo, br, cite, code, data, dfn, em, i, kdm, mark, q, rb, rp, rt, rtc, ruby, s, samp, small, span, strong, sub, sup, time, tt, u, wbr, area, audio, img, map, track, video, embed, iframe, noembed, object, param, picture, source, canvas, noscript, script, del, ins, caption, col, colgroup, table, tbody, td, tfoot, th, thead, tr, button, datalist, fieldset, form, formfield, input, label, legend, meter, optgroup, option, output, progress, select, textarea, details, dialog, menu, menuitem, summary, content, element, slot, template } = tagl(m);

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

const randomElement = (arr = []) => arr[trunc(random() * arr.length)];

const COLORS = freeze({
    GREEN: 'green',
    BLUE: 'blue',
    RED: 'red',
    BLACK: 'black',
    YELLOW: 'yellow',
});

const AV_COLORS = ["GREEN", "BLUE", "RED"]


let N = 7;
let field = [];
let score = 0;
let key = 0;

const use = (v, fn) => fn(v);
const coord = idx => ({ c: idx % N, r: trunc(idx / N) })
const index = p => p.r * N + p.c;
const onBoard = p => p.r >= 0 && p.c >= 0 && p.r < N && p.c < N;
const neighbors = p => [
    { r: p.r - 1, c: p.c },
    { r: p.r + 1, c: p.c },
    { r: p.r, c: p.c - 1 },
    { r: p.r, c: p.c + 1 }
].filter(onBoard);
const colorAt = p => field[index(p)].c;
const countAt = p => field[index(p)].n;
const contains = (arr, e) => arr.indexOf(e) >= 0;
const flood = (p, connected = []) => {
    if (!contains(connected, index(p))) {
        connected.push(index(p));
        use(
            colorAt(p),
            own => neighbors(p)
            .filter(n => colorAt(n) === own)
            .forEach(n => flood(n, connected))
        )
    }
    return connected;
};

const drop = () => {
    range(N * N)
        .map(i => N * N - i - 1)
        .forEach(idx => {
            while (colorAt(coord(idx)) === "BLACK") {
                console.log(colorAt(coord(idx)))
                for (let c = idx; c >= 0; c = c - N) {
                    if (c >= N) {
                        field[c] = field[c - N];
                    } else {
                        field[c] = { n: 1, c: randomColor(), x: key++ }
                    }
                    m.redraw();
                }
            }
        });
    m.redraw();
};

const click = (idx) => {
    const connected = flood(coord(idx));
    if (connected.length >= 3) {
        score = score + connected.length * connected.length;
        field[idx].n = connected.map(coord).map(countAt).reduce((acc, v) => acc + v, 0);
        connected.filter(i => field[idx].c === 'YELLOW' ? true : i != idx).forEach(n => (field[n] = {
            c: "BLACK",
            n: 0,
            x: key++
        }));
        if (field[idx].n > 10) {
            field[idx].c = "YELLOW";
        }
    }
    setTimeout(drop, 200)
};

const randomColor = () => randomElement(AV_COLORS);
const init = N => range(N * N).map(i => ({ x: key++, n: 1, c: randomColor() }));
const newGame = () => {
    score = 0;
    field = init(N);
};

newGame();

console.log(field)

//setInterval(() => [newGame(), m.redraw()], 100)

const box = vnode => ({
    // onbeforeremove: function(vnode) {
    //     if (vnode.attrs.field.c === 'BLACK') {
    //         vnode.dom.classList.add("fade-out")
    //         return new Promise(function(resolve) {
    //             setTimeout(resolve, 1000)
    //         })
    //     }
    // },
    view: ({ attrs: { field, onclick } }) => div[COLORS[field.c]].box({
        onclick
    }, field.n > 1 ? field.n : '')
});

m.mount(document.body, {
    view: vnode => [
        h1('Blocker ', small(score)),
        div[`field${N}`](
            field.map((f, idx) => m(box, {
                    key: f.x,
                    field: f,
                    onclick: () => click(idx)
                })
                /*div[COLORS[f.c]].box({
                               onclick: () => click(idx)
                           }, f.n > 1 ? f.n : ''))*/
            ))
    ]
})