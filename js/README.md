# hardguard25

JavaScript reference implementation of HardGuard25, an open standard for human-safe identifiers.

```
0 1 2 3 4 5 6 7 8 9 A C D F G H J K M N P R U W Y
```

## Install

```bash
npm install hardguard25
```

## Quickstart

```js
import { generate, validate, normalize, checkDigit, verifyCheckDigit } from 'hardguard25';

generate(8);                          // e.g. "AC3H7PUW"
generate(8, { checkDigit: true });    // appends one check character
validate("ac3h-7puw");               // true
normalize("ac3h-7puw");              // "AC3H7PUW"
checkDigit("AC3H7PUW");              // "N"
verifyCheckDigit("AC3H7PUWN");       // true
```

Generation uses `crypto.getRandomValues` and unbiased rejection sampling. HardGuard25 is an identifier alphabet, not an authentication, authorization, encryption, or global uniqueness protocol.

## Documentation

- Homepage: https://hardguard25.com/
- Specification: https://github.com/snapsynapse/hardguard25/blob/main/SPEC.md
- Implementation guide: https://github.com/snapsynapse/hardguard25/blob/main/docs/IMPLEMENTATION.md
- Security policy: https://github.com/snapsynapse/hardguard25/security/policy
