import { JsnixTerminal } from "@jsnix/utils/terminal";
import { FitAddon } from '@jsnix/addon-fit';
import '@jsnix/xterm/css/xterm.css';

let term = new JsnixTerminal({
    allowProposedApi: true,
    reflowCursorLine: false,
});
term.debug = true
const fit = new FitAddon()
term.open(document.getElementById('root')!);
term.loadAddon(fit)
fit.fit()
for (let i = 0; i < 30; i++) {
    term.writeln(`line ${i}`)
}

window.requestAnimationFrame(async () => {
    await term.writeln(`last line`)

    const test = document.createElement('div')
    test.style.height = '500px'
    test.style.backgroundColor = 'red'
    const marker = term.registerMarker(-1)
    term.attachElementToMarker(test, marker)

    await new Promise((resolve) => {
        window.requestAnimationFrame(resolve)
    })

    await term.writeln(`after element line`)
    await term.writeln(`next marker`)

    const next = document.createElement('div')
    next.style.height = '500px'
    next.style.backgroundColor = 'red'
    const nextMarker = term.registerMarker(-1)
    term.attachElementToMarker(next, nextMarker)
    await new Promise((resolve) => {
        window.requestAnimationFrame(resolve)
    })

    console.log(term.getActiveBuffer())
    const onResize = async () => {
        term.debug = true
        try {
            console.debug('fitaddon resizing terminal', term.cols, term.rows)
            console.debug('terminal resized', term.cols, term.rows)
            window.requestAnimationFrame(() => {
                fit.fit()
            })
        } catch (e) {
            console.error(e);
        }
        term.debug = false
    };

    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target === term.element) {
                onResize();
            }
        }
    });
    resizeObserver.observe(term.element!);
})

