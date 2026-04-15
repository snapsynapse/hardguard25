"""
HardGuard25: A 25-character alphabet for human-friendly unique IDs.

This module provides functions for generating, validating, and managing
HardGuard25 identifiers. The alphabet excludes visually ambiguous characters
(B, E, I, L, O, Q, S, T, V, X, Z) to prevent confusion.

Character set: 0 1 2 3 4 5 6 7 8 9 A C D F G H J K M N P R U W Y
"""

import re
import secrets
from typing import Dict

__version__ = "1.3.1"

# The 25-character HardGuard25 alphabet
ALPHABET = "0123456789ACDFGHJKMNPRUWY"

# Frozenset for O(1) membership testing
ALPHABET_SET = frozenset(ALPHABET)

# Dictionary mapping each character to its 0-24 index
_CHAR_TO_INDEX: Dict[str, int] = {char: idx for idx, char in enumerate(ALPHABET)}

# Compiled regex pattern for validation
_REGEX = re.compile(r"^[0-9ACDFGHJKMNPRUWY]+$")


def generate(length: int, *, check_digit: bool = False) -> str:
    """
    Generate a random HardGuard25 identifier.

    Uses cryptographically secure random number generation with rejection sampling
    to ensure uniform distribution across the 25-character alphabet.

    Args:
        length: The desired length of the identifier (must be > 0).
        check_digit: If True, append a check digit (result will be length+1 chars).

    Returns:
        A random HardGuard25 string of the specified length (plus 1 if check_digit=True).

    Raises:
        ValueError: If length <= 0.
    """
    if length <= 0:
        raise ValueError("length must be greater than 0")

    result = []
    alphabet_len = 25

    # Rejection sampling: only accept byte values < 225 (25*9)
    # This ensures uniform distribution
    while len(result) < length:
        random_bytes = secrets.token_bytes(1)
        byte_val = random_bytes[0]

        # Reject values >= 225 to ensure uniform distribution
        if byte_val < 225:
            index = byte_val % alphabet_len
            result.append(ALPHABET[index])

    code = "".join(result)

    if check_digit:
        code += check_digit_func(code)

    return code


def validate(input_str: str) -> bool:
    """
    Validate a HardGuard25 identifier.

    Normalizes the input and checks if it matches the HardGuard25 pattern.
    Never raises an exception; returns False for invalid input.

    Args:
        input_str: The string to validate.

    Returns:
        True if the input is a valid HardGuard25 identifier, False otherwise.
    """
    try:
        normalized = normalize(input_str)
        return bool(_REGEX.match(normalized))
    except ValueError:
        return False


def normalize(input_str: str) -> str:
    """
    Normalize a HardGuard25 identifier.

    Trims whitespace, collapses separators (hyphens, spaces, underscores, dots),
    converts to uppercase, and validates the result.

    Args:
        input_str: The string to normalize.

    Returns:
        The normalized HardGuard25 string.

    Raises:
        ValueError: If the input contains invalid characters (after separator removal).
    """
    if not isinstance(input_str, str):
        raise ValueError("input must be a string")

    # Trim whitespace
    normalized = input_str.strip()

    # Remove common separators
    normalized = normalized.replace("-", "").replace(" ", "").replace("_", "").replace(".", "")

    # Convert to uppercase
    normalized = normalized.upper()

    # Check for invalid characters
    if not _REGEX.match(normalized):
        raise ValueError(f"invalid characters in input: {input_str}")

    return normalized


def check_digit(code: str) -> str:
    """
    Compute the check digit for a HardGuard25 code.

    Uses a mod-25 weighted checksum where each character is weighted by its
    position (1-indexed).

    Args:
        code: The code to compute the check digit for.

    Returns:
        A single character representing the check digit.

    Raises:
        ValueError: If the code contains invalid characters.
    """
    if not code:
        raise ValueError("code must not be empty")

    upper_code = code.upper()
    try:
        weighted_sum = sum(
            _CHAR_TO_INDEX[char] * (i + 1)
            for i, char in enumerate(upper_code)
        )
    except KeyError as e:
        raise ValueError(f"invalid character in code: {e}")

    return ALPHABET[weighted_sum % 25]


def verify_check_digit(code_with_check: str) -> bool:
    """
    Verify the check digit of a HardGuard25 code.

    Strips the last character, recomputes the check digit, and compares.

    Args:
        code_with_check: The code including the check digit.

    Returns:
        True if the check digit is valid, False otherwise.
    """
    if not isinstance(code_with_check, str) or len(code_with_check) < 2:
        return False

    try:
        upper = code_with_check.upper()
        code = upper[:-1]
        provided_check = upper[-1]
        computed_check = check_digit(code)
        return provided_check == computed_check
    except (ValueError, AttributeError):
        return False


# Backward-compatible alias for earlier pre-release naming.
check_digit_func = check_digit


__all__ = [
    "ALPHABET",
    "ALPHABET_SET",
    "generate",
    "validate",
    "normalize",
    "check_digit",
    "check_digit_func",
    "verify_check_digit",
]
