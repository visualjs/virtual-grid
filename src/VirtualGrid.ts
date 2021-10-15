import SizeAndPositionManager, { Range } from "./SizeAndPositionManager";
import { ALIGNMENT, SCROLL_CHANGE_REASON } from "./constants";
import { STYLE_WRAPPER, STYLE_INNER, STYLE_ITEM } from "./styles";
import { CellInfo, CSSProperties, ItemSize } from "./types";
import { toInlineStyle } from "./utils";

const DEFAULT_OVERSCAN_ROW_COUNT = 3;
const DEFAULT_OVERSCAN_COLUMN_COUNT = 1;

const DEFAULT_ROW_HEIGHT = 50;
const DEFAULT_COLUMN_WIDTH = 100;

interface StyleCache {
    [id: number]: string;
}

export interface Options {
    className?: string;
    style?: CSSProperties;
    rowClassName?: string;
    rowStyle?: CSSProperties;
    // container width and height
    width: number;
    height: number;
    // rows
    rowCount: number;
    rowHeight: ItemSize;
    estimatedRowHeight?: number;
    // columns
    columnCount: number;
    columnWidth: ItemSize;
    estimatedColumnWidth?: number;
    // overscan count
    overscanColumnCount?: number;
    overscanRowCount?: number;
    // scroll offset
    scrollTopOffset?: number;
    scrollLeftOffset?: number;
    // scroll to
    scrollToColumnIndex?: number;
    scrollToColumnAlignment?: ALIGNMENT;
    scrollToRowIndex?: number;
    scrollToRowAlignment?: ALIGNMENT;
    // render
    renderCell(cellInfo: CellInfo): HTMLElement | string;
}

export interface State {
    offsetLeft: number;
    offsetTop: number;
    scrollChangeReason: SCROLL_CHANGE_REASON;
}

export class VirtualGrid {

    private state: State = {
        offsetLeft: 0,
        offsetTop: 0,
        scrollChangeReason: SCROLL_CHANGE_REASON.REQUESTED,
    };

    private options: Options;

    private rowStyleCache: StyleCache = {};

    private columnStyleCache: StyleCache = {};

    private rowManager: SizeAndPositionManager;

    private columnManager: SizeAndPositionManager;

    private inner: HTMLDivElement;

    private wrapper: HTMLDivElement;

    private lastRowRange: Range = {};

    private lastColumnRange: Range = {};

    constructor(private container: HTMLElement, options: Options) {

        this.options = Object.assign({
            overscanRowCount: DEFAULT_OVERSCAN_ROW_COUNT,
            overscanColumnCount: DEFAULT_OVERSCAN_COLUMN_COUNT,
        }, options);

        this.rowManager = new SizeAndPositionManager({
            itemCount: this.options.rowCount,
            itemSizeGetter: this.itemSizeGetter(this.options.rowHeight),
            estimatedItemSize: this.getEstimatedItemSize(
                this.options.estimatedRowHeight,
                this.options.rowHeight,
                DEFAULT_ROW_HEIGHT
            ),
        });

        this.columnManager = new SizeAndPositionManager({
            itemCount: this.options.columnCount,
            itemSizeGetter: this.itemSizeGetter(this.options.columnWidth),
            estimatedItemSize: this.getEstimatedItemSize(
                this.options.estimatedColumnWidth,
                this.options.columnWidth,
                DEFAULT_COLUMN_WIDTH
            )
        });

        const {
            width,
            height,
            className = '',
            style = {},
            scrollTopOffset, scrollToRowIndex,
            scrollLeftOffset, scrollToColumnIndex
        } = this.options;

        const wrapper = this.wrapper = document.createElement('div');
        const inner = this.inner = document.createElement('div');

        wrapper.setAttribute('style', toInlineStyle({ ...STYLE_WRAPPER, ...style, width, height }));
        wrapper.className = className;
        inner.setAttribute('style', toInlineStyle(STYLE_INNER));
        wrapper.appendChild(inner);
        this.container.appendChild(wrapper);


        const offsetLeft = (
            scrollLeftOffset ||
            (scrollToColumnIndex != null && this.getOffsetForColumn(scrollToColumnIndex)) ||
            0
        );

        const offsetTop = (
            scrollTopOffset ||
            (scrollToRowIndex != null && this.getOffsetForRow(scrollToRowIndex)) ||
            0
        );

        this.setState({
            offsetLeft,
            offsetTop,
            scrollChangeReason: SCROLL_CHANGE_REASON.REQUESTED
        }, () => {
            this.wrapper.scrollLeft = offsetLeft;
            this.wrapper.scrollTop = offsetTop;

            this.wrapper.addEventListener('scroll', this.handleScroll, {
                passive: true,
            });
        });
    }

    destroy() {
        this.wrapper.removeEventListener('scroll', this.handleScroll);
        this.container.innerHTML = '';
    }

    scrollTo({ top, left }: { top?: number, left?: number }) {
        if (top != undefined && this.wrapper) {
            this.wrapper['scrollTop'] = top;
        }

        if (left != undefined && this.wrapper) {
            this.wrapper['scrollLeft'] = left;
        }
    }

    scrollToRow(index: number, alignment: ALIGNMENT = 'start') {
        const offset = this.getOffsetForRow(index, alignment);
        this.wrapper.scrollTop = offset;
    }

    scrollToColumn(index: number, alignment: ALIGNMENT = 'start') {
        const offset = this.getOffsetForColumn(index, alignment);
        this.wrapper.scrollLeft = offset;
    }

    getOffsetForRow(
        index: number,
        scrollToAlignment = this.options.scrollToRowAlignment,
        itemCount: number = this.options.rowCount,
    ): number {
        if (index < 0 || index >= itemCount) {
            index = 0;
        }

        return this.rowManager.getUpdatedOffsetForIndex({
            align: scrollToAlignment,
            containerSize: this.options.height,
            currentOffset: (this.state && this.state.offsetTop) || 0,
            targetIndex: index,
        });
    }

    getOffsetForColumn(
        index: number,
        scrollToAlignment = this.options.scrollToColumnAlignment,
        itemCount: number = this.options.columnCount,
    ): number {
        if (index < 0 || index >= itemCount) {
            index = 0;
        }

        return this.columnManager.getUpdatedOffsetForIndex({
            align: scrollToAlignment,
            containerSize: this.options.width,
            currentOffset: (this.state && this.state.offsetLeft) || 0,
            targetIndex: index,
        });
    }

    recomputeSizes(startRowIndex = 0, startColumnIndex = 0) {
        this.rowStyleCache = {};
        this.columnStyleCache = {};
        this.rowManager.resetItem(startRowIndex);
        this.columnManager.resetItem(startColumnIndex);
    }

    private setState(state: State, callback?: () => void) {
        this.state = Object.assign(this.state, state);

        requestAnimationFrame(() => {
            this.render();

            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    private itemSizeGetter = (itemSize: ItemSize) => {
        return (index: number) => this.getSize(index, itemSize);
    };

    private getEstimatedItemSize(estimatedSize?: number, itemSize?: ItemSize, defaultSize: number = 50): number {
        return (
            estimatedSize ||
            (typeof itemSize === 'number' && itemSize) ||
            defaultSize
        );
    }

    private getSize(index: number, itemSize: ItemSize): number {
        if (typeof itemSize === 'function') {
            return itemSize(index);
        }

        return Array.isArray(itemSize) ? itemSize[index] : itemSize;
    }

    private getRowStyle(index: number) {
        const style = this.rowStyleCache[index];

        if (style) {
            return style;
        }

        const { size, offset } = this.rowManager.getSizeAndPositionForIndex(index);
        return (this.rowStyleCache[index] = toInlineStyle({ ...STYLE_ITEM, height: size, transform: `translateY(${offset}px)` }));
    }

    private getColumnStyle(index: number) {
        const style = this.columnStyleCache[index];

        if (style) {
            return style;
        }

        const { size, offset } = this.columnManager.getSizeAndPositionForIndex(index);
        return (this.columnStyleCache[index] = toInlineStyle({ ...STYLE_ITEM, width: size, left: offset }));
    }

    private handleScroll = (ev: Event) => {
        const offset = this.getNodeOffset();

        if (
            offset.left < 0 ||
            offset.top < 0 ||
            ev.target !== this.wrapper ||
            (
                this.state.offsetLeft === offset.left &&
                this.state.offsetTop === offset.top
            )
        ) {
            return;
        }

        this.setState({
            offsetLeft: offset.left,
            offsetTop: offset.top,
            scrollChangeReason: SCROLL_CHANGE_REASON.OBSERVED,
        });
    }

    private getNodeOffset() {
        return {
            top: this.wrapper.scrollTop || 0,
            left: this.wrapper.scrollLeft || 0
        };
    }

    private render() {
        const {
            width,
            height,
            rowClassName = '',
            rowStyle = {},
            overscanRowCount = DEFAULT_OVERSCAN_ROW_COUNT,
            overscanColumnCount = DEFAULT_OVERSCAN_COLUMN_COUNT,
            renderCell,
        } = this.options;

        const defaultRowStyle = toInlineStyle(rowStyle);
        const { offsetLeft, offsetTop } = this.state;

        const rowRange = this.rowManager.getVisibleRange({
            containerSize: height,
            offset: offsetTop,
            overscanCount: overscanRowCount
        });

        const columnRange = this.columnManager.getVisibleRange({
            containerSize: width,
            offset: offsetLeft,
            overscanCount: overscanColumnCount,
        });

        if (
            rowRange.start == this.lastRowRange.start &&
            rowRange.stop == this.lastRowRange.stop &&
            columnRange.start == this.lastColumnRange.start &&
            columnRange.stop == this.lastColumnRange.stop
        ) {
            return;
        }

        this.lastRowRange = rowRange;
        this.lastColumnRange = columnRange;

        // build up the row's HTML in a string
        let htmlParts = [];
        if (rowRange.start != undefined && rowRange.stop != undefined) {
            for (let row = rowRange.start; row <= rowRange.stop; row++) {
                const style = this.getRowStyle(row) + defaultRowStyle;
                htmlParts.push(`<div class="${rowClassName}" style="${style}">`);
                // render cells in a row
                if (columnRange.start != undefined && columnRange.stop != undefined) {
                    for (let column = columnRange.start; column <= columnRange.stop; column++) {
                        let cell = renderCell({ style: this.getColumnStyle(column), row, column });
                        if (typeof cell !== 'string') {
                            cell = cell.outerHTML;
                        }
                        htmlParts.push(cell);
                    }
                }
                htmlParts.push('</div>');
            }
        }

        this.wrapper.style.height = `${height}px`;
        this.wrapper.style.width = `${width}px`;
        this.inner.style.height = `${this.rowManager.getTotalSize()}px`;
        this.inner.style.width = `${this.columnManager.getTotalSize()}px`;

        this.inner.innerHTML = htmlParts.join('');
    }
}

export default VirtualGrid;
