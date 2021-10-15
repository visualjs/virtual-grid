import { camelToKebab, toInlineStyle } from '../src/utils';

it('camelToKebab', () => {
    expect(camelToKebab('backgroundColor')).toBe('background-color');
    expect(camelToKebab('overflowX')).toBe('overflow-x');
    expect(camelToKebab('overflow-x')).toBe('overflow-x');
    expect(camelToKebab('backgroundRepeatX')).toBe('background-repeat-x');
});

it('toInlineStyle', () => {

    expect(toInlineStyle({
        color: 'red',
        backgroundColor: 'blue',
        left: 0,
        zIndex: 10,
    })).toBe(`color:red; background-color:blue; left:0px; z-index:10;`);

    expect(toInlineStyle({})).toBe('');

});
