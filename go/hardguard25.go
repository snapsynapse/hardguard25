// Package hardguard25 provides a 25-character low-confusion alphabet for human-readable identifiers.
package hardguard25

import (
	"crypto/rand"
	"fmt"
	"io"
	"strings"
	"unicode"
)

// Alphabet is the 25-character set used for HardGuard25 IDs.
const Alphabet = "0123456789ACDFGHJKMNPRUWY"

var (
	// AlphabetSet is a lookup map for fast character validation.
	AlphabetSet map[byte]bool

	// charToIndex maps each alphabet character to its index.
	charToIndex map[byte]int
)

func init() {
	// Initialize AlphabetSet
	AlphabetSet = make(map[byte]bool)
	for i := 0; i < len(Alphabet); i++ {
		AlphabetSet[Alphabet[i]] = true
	}

	// Initialize charToIndex
	charToIndex = make(map[byte]int)
	for i := 0; i < len(Alphabet); i++ {
		charToIndex[Alphabet[i]] = i
	}
}

// Generate creates a random HardGuard25 ID of the specified length using CSPRNG.
// Uses rejection sampling to ensure uniform distribution.
// Returns an error if length is invalid or if random number generation fails.
func Generate(length int) (string, error) {
	if length <= 0 {
		return "", fmt.Errorf("length must be positive, got %d", length)
	}

	result := make([]byte, length)
	buf := make([]byte, 1)

	for i := 0; i < length; i++ {
		// Rejection sampling: keep generating until we get a value < 225 (9 * 25)
		for {
			_, err := io.ReadFull(rand.Reader, buf)
			if err != nil {
				return "", fmt.Errorf("failed to read random bytes: %w", err)
			}

			// Accept if less than 225 to ensure uniform distribution
			if buf[0] < 225 {
				result[i] = Alphabet[buf[0]%25]
				break
			}
		}
	}

	return string(result), nil
}

// GenerateWithCheck creates a random HardGuard25 ID and appends a check digit.
// The returned ID will be length+1 characters long.
func GenerateWithCheck(length int) (string, error) {
	id, err := Generate(length)
	if err != nil {
		return "", err
	}

	digit, err := CheckDigit(id)
	if err != nil {
		return "", err
	}

	return id + string(digit), nil
}

// Validate checks if the input string is a valid HardGuard25 ID.
// It normalizes the input first and rejects an empty canonical value.
func Validate(input string) bool {
	normalized, err := Normalize(input)
	if err != nil {
		return false
	}
	return normalized != ""
}

func isUnicodeWhitespace(r rune) bool {
	switch {
	case r >= '\u0009' && r <= '\u000D':
		return true
	case r == '\u0020', r == '\u0085', r == '\u00A0', r == '\u1680':
		return true
	case r >= '\u2000' && r <= '\u200A':
		return true
	case r == '\u2028', r == '\u2029', r == '\u202F', r == '\u205F', r == '\u3000':
		return true
	default:
		return false
	}
}

// Normalize processes a HardGuard25 ID by:
// - Removing the Unicode White_Space set
// - Collapsing separators (hyphens, underscores, dots)
// - Converting to uppercase
// - Validating against the alphabet
// Returns an error if the normalized string contains invalid characters.
func Normalize(input string) (string, error) {
	// Remove punctuation separators and the pinned Unicode White_Space set.
	normalized := strings.Map(func(r rune) rune {
		switch {
		case r == '-', r == '_', r == '.':
			return -1
		case isUnicodeWhitespace(r):
			return -1
		default:
			return r
		}
	}, input)

	// Convert to uppercase
	normalized = strings.ToUpper(normalized)
	if normalized == "" {
		return "", fmt.Errorf("input must contain at least one identifier character")
	}

	// Validate characters
	for _, ch := range normalized {
		if ch > unicode.MaxASCII || !AlphabetSet[byte(ch)] {
			return "", fmt.Errorf("invalid character in input: %c", ch)
		}
	}

	return normalized, nil
}

// CheckDigit computes a mod-25 weighted checksum for the given code.
// The checksum is: sum of (charIndex[i] * (i+1)) % 25
// Returns the alphabet character at the resulting index.
func CheckDigit(code string) (byte, error) {
	if code == "" {
		return 0, fmt.Errorf("code must not be empty")
	}
	code = strings.ToUpper(code)

	sum := 0
	for i, ch := range code {
		if ch > unicode.MaxASCII {
			return 0, fmt.Errorf("invalid character in code: %c", ch)
		}
		idx, ok := charToIndex[byte(ch)]
		if !ok {
			return 0, fmt.Errorf("invalid character in code: %c", ch)
		}
		sum += idx * (i + 1)
	}

	checksumIndex := sum % 25
	return Alphabet[checksumIndex], nil
}

// VerifyCheckDigit validates the check digit of a HardGuard25 ID.
// It strips the last character, recomputes the check digit, and compares.
// Returns true if the check digit is valid, false otherwise.
// Returns an error if the input is too short or contains invalid characters.
func VerifyCheckDigit(codeWithCheck string) (bool, error) {
	normalized, err := Normalize(codeWithCheck)
	if err != nil {
		return false, err
	}

	if len(normalized) < 2 {
		return false, fmt.Errorf("code with check digit must be at least 2 characters after normalization, got %d", len(normalized))
	}

	code := normalized[:len(normalized)-1]
	providedDigit := normalized[len(normalized)-1]

	computed, err := CheckDigit(code)
	if err != nil {
		return false, err
	}

	return computed == providedDigit, nil
}
