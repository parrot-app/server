import blessed from 'blessed';
import { exec } from "child_process";

/**
 * Installer CLI app will go here
 * It needs to:
 * - Init a sample config file or fill it with the user's answers
 * - Init an env file
 * - Create the cache folder
 * - Check if the init is ready and start parrot
 */
const screen = blessed.screen({
    smartCSR: true,
    autoPadding: true,
    fullUnicode: true,
    title: 'ParrotJS Installer',
});

// Header
const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: `ParrotJS - Installer`,
    style: {
        fg: 'white',
        bg: 'blue',
    },
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
    content: 'q: [Q]uit',
    style: {
        fg: 'white',
        bg: 'blue',
    },
});

screen.append(header);
screen.append(content);
screen.append(footer);

screen.render();

screen.key(['escape', 'q', 'C-c'], () => {
    addContentLine(
        `Quitting the installer...`,
        content,
        screen,
    );
});

exec('npm i --prefix ./ @parrot-app/server', (
    error, stdout, stderr
) => {
    if (error) {
        addContentLine(error.toString(), content, screen);
    }
    if (stdout) {
        addContentLine(stdout, content, screen);
    }
    if (stderr) {
        addContentLine(stderr, content, screen);
    }
});


function addContentLine(
    text: string,
    content: blessed.Widgets.BoxElement,
    screen: blessed.Widgets.Screen,
) {
    const maxContentLines = Math.floor(Number(content.height));
    if (content.getLines().length > maxContentLines - 2) {
        content.shiftLine(1);
    }
    content.pushLine(text);
    screen.render();
}