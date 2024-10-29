import blessed from 'blessed';
import { ParrotServer } from './server';
import { ParrotServerEventsEnum } from './consts/ParrotServerEvents.enum';

const parrotServerInstance = new ParrotServer();

const screen = blessed.screen({
    smartCSR: true,
    autoPadding: true,
    fullUnicode: true,
    title: 'ParrotJS server',
});

// Header
const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: `ParrotJS - ${parrotServerInstance.host} => ${parrotServerInstance.target}`,
    style: {
        fg: 'white',
        bg: 'blue',
    },
});

parrotServerInstance.on(ParrotServerEventsEnum.SERVER_LISTEN, () => {
    header.style.bg = 'green';
    header.style.fg = 'black';
    screen.render();
});

const content = blessed.box({
    top: 1,
    left: 0,
    width: '100%',
    height: '100%-2',
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    mouse: false,
    vi: true,
    tags: true,
    style: {
        fg: 'white',
        bg: 'black',
    },
});

// Footer
const footer = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: 'q: [Q]uit | i: [I]ntercept',
    style: {
        fg: 'white',
        bg: 'blue',
    },
});

screen.append(header);
screen.append(content);
screen.append(footer);

screen.render();

parrotServerInstance.on(ParrotServerEventsEnum.LOG_INFO, (text: string) => {
    addContentLine(`{blue-fg}${text}{/}`, content, screen);
});

parrotServerInstance.on(ParrotServerEventsEnum.LOG_SUCCESS, (text: string) => {
    addContentLine(`{green-fg}${text}{/}`, content, screen);
});

parrotServerInstance.on(ParrotServerEventsEnum.LOG_ERROR, (text: string) => {
    addContentLine(`{red-fg}${text}{/}`, content, screen);
});

parrotServerInstance.on(ParrotServerEventsEnum.SERVER_STOP, () => {
    addContentLine(`{center}{red-bg}{white-fg}{bold}Server stopping in 2s...{/}{/center}`, content, screen);
    setTimeout(() => {
        process.exit(0);
    }, 2000);
});

// TODO: Not sure if this is the way to do good scroll. I'll check it again later on
function addContentLine(text: string, content: blessed.Widgets.BoxElement, screen: blessed.Widgets.Screen) {
    const maxContentLines = Math.floor(Number(content.height));
    if (content.getLines().length > maxContentLines) {
        content.shiftLine(1);
    }
    content.pushLine(text);
    screen.render();
}

screen.key(['escape', 'q', 'C-c'], () => {
    addContentLine(`{center}{red-bg}{white-fg}{bold}ParrotJS gracefully shutting down...{/}{/center}`, content, screen);
    parrotServerInstance.server?.close();
});
