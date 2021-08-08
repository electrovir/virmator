import {DeepWriteable, Overwrite, Writeable} from './type';

/** Testing Writeable<T> and DeepWriteable<T> */

type Menu = Readonly<{
    breakfast: Readonly<string[]>;
    lunch: Readonly<string[]>;
    dinner: Readonly<string[]>;
}>;

const myMenu: Menu = {
    breakfast: [],
    lunch: [],
    dinner: [],
};

// @ts-expect-error
myMenu.breakfast = [];
// @ts-expect-error
myMenu.breakfast.push('egg');

const myMutableMenu: Writeable<Menu> = {
    breakfast: [],
    lunch: [],
    dinner: [],
};

myMutableMenu.breakfast = [];
// @ts-expect-error
myMutableMenu.breakfast.push('egg');

const myDeeplyMutableMenu: DeepWriteable<Menu> = {
    breakfast: [],
    lunch: [],
    dinner: [],
};

myDeeplyMutableMenu.breakfast = [];
myDeeplyMutableMenu.breakfast.push('egg');

/** Overwrite */
type thing1 = {a: string; b: number};
const what: thing1 = {a: 'hello', b: 5};
const who: Overwrite<thing1, {a: number}> = {...what, a: 2};
// @ts-expect-error
who.what = 'should not work';
