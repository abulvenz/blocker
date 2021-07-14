import m from 'mithril';
import tagl, {feDropShadow} from 'tagl-mithril';

// prettier-ignore
const { address, aside, footer, header, h1, h2, h3, h4, h5, h6, hgroup, main, nav, section, article, blockquote, dd, dir, div, dl, dt, figcaption, figure, hr, li, ol, p, pre, ul, a, abbr, b, bdi, bdo, br, cite, code, data, dfn, em, i, kdm, mark, q, rb, rp, rt, rtc, ruby, s, samp, small, span, strong, sub, sup, time, tt, u, wbr, area, audio, img, map, track, video, embed, iframe, noembed, object, param, picture, source, canvas, noscript, script, del, ins, caption, col, colgroup, table, tbody, td, tfoot, th, thead, tr, button, datalist, fieldset, form, formfield, input, label, legend, meter, optgroup, option, output, progress, select, textarea, details, dialog, menu, menuitem, summary, content, element, slot, template } = tagl(m);

const {keys, freeze} = Object;
const {trunc, random, min} = Math;

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
    GREEN: 'green',
    BLUE: 'blue',
    RED: 'red',
    BLACK: 'black',
    YELLOW: 'yellow',
});

const AV_COLORS = ['GREEN', 'BLUE', 'RED'];

let N = 7;
let field = [];
let score = 0;
let vScore = 0;
let key = 0;

const use = (v, fn) => fn(v);
const randomElement = (arr = []) => arr[trunc(random() * arr.length)];
const coord = (idx) => ({c: idx % N, r: trunc(idx / N)});
const index = (p) => p.r * N + p.c;
const onBoard = (p) => p.r >= 0 && p.c >= 0 && p.r < N && p.c < N;
const upper = (p) => ({r: p.r - 1, c: p.c});
const lower = (p) => ({r: p.r + 1, c: p.c});
const left = (p) => ({r: p.r, c: p.c - 1});
const right = (p) => ({r: p.r, c: p.c + 1});
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
                        field[c] = {n: 1, c: randomColor(), x: key++};
                    }
                }
            }
        });
    m.redraw();
    if (dropped) {
        setTimeout(drop, 200);
    }
};

const click = (idx) => {
    const connected = flood(coord(idx));
    if (connected.length >= 3) {
        const count = connected
            .map(coord)
            .map(countAt)
            .reduce((acc, v) => acc + v, 0);
        score = score + count * count + connected.length * connected.length;
        field[idx].n = count;
        connected
            .filter((i) => (field[idx].c === 'YELLOW' ? true : i != idx))
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
    }
    setTimeout(drop, 200);
};

const randomColor = () => randomElement(AV_COLORS);
const init = (N) => range(N * N).map((i) => ({x: key++, n: 1, c: randomColor()}));
const newGame = () => {
    score = 0;
    vScore = 0;
    field = init(N);
};

newGame();

console.log(field);

//setInterval(() => [newGame(), m.redraw()], 100)

const borderClasses = (idx) => use(coord(idx),p => use(colorAt(p),ownColor=>
    [{f:upper,s:'top'},{f:lower,s:'bottom'},{f:left,s:'left'},{f:right,s:'right'}]
    .filter(n=>use(n.f(p),np =>onBoard(np) && colorAt(np)===ownColor)).map(n=>'.connected-'+n.s).join(' ')
));

const box = (vnode) => ({
    view: ({attrs: {field,idx, onclick}}) =>
        div[COLORS[field.c]][borderClasses(idx)].box(
            {
                onclick,
            },
            field.n > 1 ? field.n : ''
        ),
});

const scoreView = (vnode) => ({
    view: (vnode) => small(vScore),
});

setInterval(() => [(vScore += vScore < score ? trunc((score - vScore) / 2) : 0), m.redraw()], 30);

m.mount(document.body, {
    view: (vnode) => [
        div.field[`field${N}`](
            field.map((f, idx) =>
                m(box, {
                    key: f.x,
                    field: f,
                    idx,
                    onclick: () => click(idx),
                })
            )
        ),
        h1('Blocker ', m(scoreView)),
    ],
});
