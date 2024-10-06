import colors from 'colors';

export const logError = (message: string) => {
    console.error(colors.red(`[E!] ${message}`));
};

export const logSuccess = (message: string) => {
    console.log(colors.green(`[✓] ${message}`));
};

export const logIn = (message: string) => {
    console.log(colors.cyan(`[➡] ${message}`));
};

export const logOut = (message: string) => {
    console.log(colors.cyan(`[⬅] ${message}`));
};