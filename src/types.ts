
export type ItemSizeGetter = (index: number) => number;
export type ItemSize = number | number[] | ItemSizeGetter;

export interface SizeAndPosition {
    size: number;
    offset: number;
}

export type CSSProperties = {
    [k: string]: any;
}

export interface CellInfo {
    row: number;
    column: number;
    style: string;
}
