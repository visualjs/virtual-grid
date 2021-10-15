
import { CSSProperties } from "./types";

// taken from https://github.com/preactjs/preact/blob/master/src/constants.js
export const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;

export function camelToKebab(value: string): string {
    const regex = RegExp(/[A-Z]/, 'g');
    if (!value.match(regex)) {
        return value;
    }

    return value.replace(regex, (match) => `-${match.toLowerCase()}`);
}

export function toInlineStyle(styleObj: CSSProperties) {
    const lines = Object.keys(styleObj).map(property => {
        
        let value = styleObj[property];

        if (value == null) {
            value = '';
        } else if (typeof value == 'number' && !IS_NON_DIMENSIONAL.test(property)) {
            value = value + 'px';
        }

        return `${camelToKebab(property)}:${value};`;
    });
    return lines.join(' ');
}

export function throttle(func: (...args: any) => void, ms: number, rate: number) {
    let timeout: any;
    let startTime = new Date();

    return function (...args: any) {
        let curTime = new Date();

        clearTimeout(timeout);

        if (curTime.getTime() - startTime.getTime() >= rate) {
            func(...args);
            startTime = curTime;
        } else {
            timeout = setTimeout(() => {
                func(...args);
            }, ms);
        }
    };
};
