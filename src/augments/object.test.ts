import {testGroup} from 'test-vir';
import {
    filterToEnumValues,
    getEnumTypedKeys,
    getEnumTypedValues,
    getObjectTypedKeys,
    getObjectTypedValues,
    isEnumValue,
} from './object';

enum Planet {
    Mercury = 'mercury',
    Venus = 'venus',
    Earth = 'earth',
}

testGroup({
    description: getEnumTypedKeys.name,
    tests: (runTest) => {
        runTest({
            description: 'gets basic enum keys properly',
            expect: ['Mercury', 'Venus', 'Earth'],
            test: () => {
                return getEnumTypedKeys(Planet);
            },
        });

        runTest({
            description: 'enum keys can be used to access the enum',
            expect: [Planet.Mercury, Planet.Venus, Planet.Earth],
            test: () => {
                const keys = getEnumTypedKeys(Planet);
                return keys.map((key) => Planet[key]);
            },
        });
    },
});

testGroup({
    description: getEnumTypedValues.name,
    tests: (runTest) => {
        runTest({
            description: 'gets basic enum values properly',
            expect: [Planet.Mercury, Planet.Venus, Planet.Earth],
            test: () => {
                return getEnumTypedValues(Planet);
            },
        });
    },
});

testGroup({
    description: isEnumValue.name,
    tests: (runTest) => {
        const testEnumValues = [
            Planet.Mercury,
            Planet.Venus,
            Planet.Earth,
            'moon',
            'luna',
            'not a planet',
        ];

        runTest({
            description: 'matches all correct enum values',
            expect: [Planet.Mercury, Planet.Venus, Planet.Earth],
            test: () => {
                return testEnumValues.filter((testValue) => isEnumValue(testValue, Planet));
            },
        });
    },
});

const greekNames: Record<Planet, string> = {
    [Planet.Mercury]: 'Hermes',
    [Planet.Venus]: 'Aphrodite',
    [Planet.Earth]: 'Earth',
};

testGroup({
    description: getObjectTypedKeys.name,
    tests: (runTest) => {
        runTest({
            description: 'gets basic object keys',
            expect: [Planet.Mercury, Planet.Venus, Planet.Earth],
            test: () => {
                return getObjectTypedKeys(greekNames);
            },
        });
    },
});

testGroup({
    description: getObjectTypedValues.name,
    tests: (runTest) => {
        runTest({
            description: 'gets basic object values',
            expect: [
                greekNames[Planet.Mercury],
                greekNames[Planet.Venus],
                greekNames[Planet.Earth],
            ],
            test: () => {
                return getObjectTypedValues(greekNames);
            },
        });
    },
});

testGroup({
    description: filterToEnumValues.name,
    tests: (runTest) => {
        enum TestEnum {
            A = 'a',
            B = 'b',
            C = 'c',
        }

        runTest({
            description: 'empty input results in empty output',
            expect: [],
            test: () => {
                return filterToEnumValues([], TestEnum);
            },
        });

        runTest({
            description: 'excludes invalid enum values',
            expect: [],
            test: () => {
                return filterToEnumValues(['derby', 'who', 'done', 'it'], TestEnum);
            },
        });

        const validValuesTest = [TestEnum.A, TestEnum.B, TestEnum.C];
        runTest({
            description: 'includes valid enum values',
            expect: validValuesTest,
            test: () => {
                return filterToEnumValues(validValuesTest, TestEnum);
            },
        });

        runTest({
            description: 'output order matches input order',
            expect: [TestEnum.C, TestEnum.B, TestEnum.A],
            test: () => {
                return filterToEnumValues(
                    ['what', TestEnum.C, 'who', 'where', 'why', TestEnum.B, TestEnum.A],
                    TestEnum,
                );
            },
        });
    },
});
