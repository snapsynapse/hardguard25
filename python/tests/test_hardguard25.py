"""
Comprehensive test suite for HardGuard25.

Tests cover alphabet validation, ID generation, validation, normalization,
check digits, and distribution characteristics.
"""

import pytest
from collections import Counter

import hardguard25


class TestAlphabet:

    def test_alphabet_length(self):
        assert len(hardguard25.ALPHABET) == 25

    def test_alphabet_set_matches_alphabet(self):
        assert hardguard25.ALPHABET_SET == frozenset(hardguard25.ALPHABET)

    def test_no_duplicates_in_alphabet(self):
        assert len(set(hardguard25.ALPHABET)) == 25

    def test_no_excluded_chars(self):
        excluded = set("BEILOQSTVXZ")
        alphabet_set = set(hardguard25.ALPHABET)
        assert alphabet_set.isdisjoint(excluded)

    def test_only_base10_and_uppercase_letters(self):
        for char in hardguard25.ALPHABET:
            assert char.isdigit() or char.isupper()

    def test_char_to_index_mapping(self):
        for idx, char in enumerate(hardguard25.ALPHABET):
            assert hardguard25._CHAR_TO_INDEX[char] == idx


class TestGeneration:

    def test_generate_correct_length(self):
        for length in [1, 5, 10, 32, 64, 128]:
            result = hardguard25.generate(length)
            assert len(result) == length

    def test_generate_invalid_length(self):
        with pytest.raises(ValueError):
            hardguard25.generate(0)
        with pytest.raises(ValueError):
            hardguard25.generate(-1)

    def test_generate_only_valid_chars(self):
        for _ in range(1000):
            result = hardguard25.generate(20)
            for char in result:
                assert char in hardguard25.ALPHABET_SET

    def test_generate_with_check_digit(self):
        for length in [5, 10, 32]:
            result = hardguard25.generate(length, check_digit=True)
            assert len(result) == length + 1

    def test_generate_randomness(self):
        results = [hardguard25.generate(20) for _ in range(10)]
        assert len(set(results)) == 10

    def test_generate_distribution(self):
        chars = []
        for _ in range(400):
            chars.extend(hardguard25.generate(25))
        counter = Counter(chars)
        assert len(counter) == 25
        for char in hardguard25.ALPHABET:
            assert counter.get(char, 0) > 0


class TestValidation:

    def test_validate_valid_ids(self):
        valid_ids = [
            "ACD123",
            "0123456789",
            "ACDFGHJKMNPRUWY",
            "acd123",
            "A-C-D-1-2-3",
            "A C D 1 2 3",
            "A_C_D_1_2_3",
            "A.C.D.1.2.3",
        ]
        for test_id in valid_ids:
            assert hardguard25.validate(test_id), f"Failed to validate: {test_id}"

    def test_validate_invalid_ids(self):
        invalid_ids = [
            "BEILOQSTVXZ",
            "!@#$%^&*()",
            "ACD123XBZ",
            "",
        ]
        for test_id in invalid_ids:
            assert not hardguard25.validate(test_id), f"Should not validate: {test_id}"

    def test_validate_never_raises(self):
        test_inputs = [None, 123, [], {}, "ACD\x00123"]
        for test_input in test_inputs:
            try:
                result = hardguard25.validate(test_input)
                assert isinstance(result, bool)
            except Exception as e:
                pytest.fail(f"validate() raised {type(e).__name__}: {e}")


class TestNormalization:

    def test_normalize_uppercase(self):
        assert hardguard25.normalize("acd") == "ACD"
        assert hardguard25.normalize("aCd") == "ACD"

    def test_normalize_trim_whitespace(self):
        assert hardguard25.normalize("  ACD123  ") == "ACD123"

    def test_normalize_remove_separators(self):
        assert hardguard25.normalize("A-C-D-1-2-3") == "ACD123"
        assert hardguard25.normalize("A C D 1 2 3") == "ACD123"
        assert hardguard25.normalize("A_C_D_1_2_3") == "ACD123"
        assert hardguard25.normalize("A.C.D.1.2.3") == "ACD123"
        assert hardguard25.normalize("A-C D_1.2 3") == "ACD123"

    def test_normalize_idempotent(self):
        test_ids = ["acd-123", "A C D 1 2 3", "A_C_D_1_2_3", "A.C.D.1.2.3"]
        for test_id in test_ids:
            once = hardguard25.normalize(test_id)
            twice = hardguard25.normalize(once)
            assert once == twice

    def test_normalize_invalid_input_raises(self):
        invalid_inputs = ["BEILOQSTVXZ", "ACD!@#"]
        for test_input in invalid_inputs:
            with pytest.raises(ValueError):
                hardguard25.normalize(test_input)

    def test_normalize_non_string_input_raises(self):
        with pytest.raises(ValueError):
            hardguard25.normalize(123)
        with pytest.raises(ValueError):
            hardguard25.normalize(None)


class TestCheckDigit:

    def test_check_digit_returns_single_char(self):
        for length in [1, 5, 10, 32]:
            code = hardguard25.generate(length)
            digit = hardguard25.check_digit(code)
            assert len(digit) == 1
            assert digit in hardguard25.ALPHABET_SET

    def test_check_digit_deterministic(self):
        code = "ACD123"
        digit1 = hardguard25.check_digit(code)
        digit2 = hardguard25.check_digit(code)
        assert digit1 == digit2

    def test_check_digit_different_for_different_codes(self):
        digits = set()
        for length in [1, 2, 3, 4, 5]:
            code = hardguard25.generate(length)
            digit = hardguard25.check_digit(code)
            digits.add(digit)
        assert len(digits) > 1

    def test_check_digit_invalid_input_raises(self):
        with pytest.raises(ValueError):
            hardguard25.check_digit("")
        with pytest.raises(ValueError):
            hardguard25.check_digit("ACD!@#")

    def test_check_digit_backward_compatible_alias(self):
        code = "ACD123"
        assert hardguard25.check_digit(code) == hardguard25.check_digit_func(code)

    def test_verify_check_digit_valid(self):
        code = hardguard25.generate(10)
        digit = hardguard25.check_digit(code)
        full_code = code + digit
        assert hardguard25.verify_check_digit(full_code)

    def test_verify_check_digit_invalid(self):
        code = hardguard25.generate(10)
        digit = hardguard25.check_digit(code)
        wrong_chars = [c for c in hardguard25.ALPHABET if c != digit]
        wrong_code = code + wrong_chars[0]
        assert not hardguard25.verify_check_digit(wrong_code)

    def test_verify_check_digit_short_input(self):
        assert not hardguard25.verify_check_digit("")
        assert not hardguard25.verify_check_digit("A")

    def test_verify_check_digit_never_raises(self):
        test_inputs = ["ACD!@#", None, 123, []]
        for test_input in test_inputs:
            try:
                result = hardguard25.verify_check_digit(test_input)
                assert isinstance(result, bool)
            except Exception as e:
                pytest.fail(f"verify_check_digit() raised {type(e).__name__}: {e}")

    def test_check_digit_workflow(self):
        for _ in range(100):
            code = hardguard25.generate(15)
            digit = hardguard25.check_digit(code)
            full = code + digit
            assert hardguard25.verify_check_digit(full)
            wrong_chars = [c for c in hardguard25.ALPHABET if c != digit]
            corrupted = code + wrong_chars[0]
            assert not hardguard25.verify_check_digit(corrupted)


class TestDistribution:

    def test_distribution_all_chars_appear(self):
        chars = []
        for _ in range(400):
            chars.extend(hardguard25.generate(25))
        counter = Counter(chars)
        assert len(counter) == 25

    def test_distribution_roughly_uniform(self):
        chars = []
        for _ in range(400):
            chars.extend(hardguard25.generate(25))
        counter = Counter(chars)
        total = len(chars)
        expected_per_char = total / 25
        for char in hardguard25.ALPHABET:
            count = counter.get(char, 0)
            ratio = count / expected_per_char
            assert 0.5 < ratio < 1.5
