package hardguard25

import (
	"strings"
	"testing"
)

// TestAlphabetLength verifies the alphabet has exactly 25 characters.
func TestAlphabetLength(t *testing.T) {
	if len(Alphabet) != 25 {
		t.Errorf("Alphabet length should be 25, got %d", len(Alphabet))
	}
}

// TestNoExcludedChars verifies that commonly confused characters are excluded.
func TestNoExcludedChars(t *testing.T) {
	excluded := []byte{'B', 'E', 'I', 'L', 'O', 'Q', 'S', 'T', 'V', 'X', 'Z'}
	for _, ch := range excluded {
		if strings.ContainsRune(Alphabet, rune(ch)) {
			t.Errorf("Character %c should not be in alphabet", ch)
		}
	}
}

// TestGenerate verifies that Generate produces valid IDs of correct length.
func TestGenerate(t *testing.T) {
	lengths := []int{8, 16, 32}
	for _, length := range lengths {
		for i := 0; i < 100; i++ {
			id, err := Generate(length)
			if err != nil {
				t.Fatalf("Generate failed: %v", err)
			}

			if len(id) != length {
				t.Errorf("Generated ID length should be %d, got %d", length, len(id))
			}

			if !Validate(id) {
				t.Errorf("Generated ID %s failed validation", id)
			}
		}
	}

	// Test with 1000 IDs to check for uniqueness
	ids := make(map[string]bool)
	for i := 0; i < 1000; i++ {
		id, err := Generate(16)
		if err != nil {
			t.Fatalf("Generate failed: %v", err)
		}
		if ids[id] {
			t.Errorf("Duplicate ID generated: %s", id)
		}
		ids[id] = true
	}
}

// TestGenerateWithCheck verifies that GenerateWithCheck returns length+1.
func TestGenerateWithCheck(t *testing.T) {
	baseLength := 16
	id, err := GenerateWithCheck(baseLength)
	if err != nil {
		t.Fatalf("GenerateWithCheck failed: %v", err)
	}

	if len(id) != baseLength+1 {
		t.Errorf("GenerateWithCheck should return length %d, got %d", baseLength+1, len(id))
	}

	if !Validate(id) {
		t.Errorf("Generated ID with check %s failed validation", id)
	}
}

// TestValidate verifies validation of valid and invalid IDs.
func TestValidate(t *testing.T) {
	tests := []struct {
		name  string
		input string
		valid bool
	}{
		{"Valid ID", "0123456789ACDFGH", true},
		{"Valid with separators", "0123-4567-89AC-DFGH", true},
		{"Valid with underscores", "0123_4567_89AC_DFGH", true},
		{"Valid with spaces", "0123 4567 89AC DFGH", true},
		{"Valid with dots", "0123.4567.89AC.DFGH", true},
		{"Invalid character B", "0123B456789ACDFGH", false},
		{"Invalid character E", "0123E456789ACDFGH", false},
		{"Invalid character I", "0123I456789ACDFGH", false},
		{"Invalid character O", "0123O456789ACDFGH", false},
		{"Empty string", "", false},
		{"Mixed case valid", "0123-acdf-ghkm", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Validate(tt.input)
			if result != tt.valid {
				t.Errorf("Validate(%q) = %v, want %v", tt.input, result, tt.valid)
			}
		})
	}
}

// TestNormalize verifies normalization behavior.
func TestNormalize(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{"Simple ID", "0123456789", "0123456789", false},
		{"With hyphens", "0123-4567-89", "0123456789", false},
		{"With spaces", "0123 4567 89", "0123456789", false},
		{"With underscores", "0123_4567_89", "0123456789", false},
		{"With dots", "0123.4567.89", "0123456789", false},
		{"With leading/trailing space", "  0123456789  ", "0123456789", false},
		{"Lowercase", "acdfghkm", "ACDFGHKM", false},
		{"Mixed separators", "01-23_45.67 89", "0123456789", false},
		{"Invalid character", "0123B456789", "", true},
		{"Invalid character O", "0123O456789", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Normalize(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("Normalize(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("Normalize(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}

	// Test idempotence
	original := "01-23-45-67-89"
	normalized1, err := Normalize(original)
	if err != nil {
		t.Fatalf("First normalize failed: %v", err)
	}
	normalized2, err := Normalize(normalized1)
	if err != nil {
		t.Fatalf("Second normalize failed: %v", err)
	}
	if normalized1 != normalized2 {
		t.Errorf("Normalize is not idempotent: %q -> %q -> %q", original, normalized1, normalized2)
	}
}

// TestCheckDigit verifies check digit computation.
func TestCheckDigit(t *testing.T) {
	codes := []string{
		"0",
		"0123456789",
		"ACDFGHJKMNPRUWY",
		"0000000000",
	}

	for _, code := range codes {
		digit, err := CheckDigit(code)
		if err != nil {
			t.Errorf("CheckDigit(%q) error: %v", code, err)
			continue
		}

		// Verify the result is a valid alphabet character
		if !AlphabetSet[digit] {
			t.Errorf("CheckDigit(%q) returned invalid character: %c", code, digit)
		}
	}

	// Test with invalid character
	_, err := CheckDigit("0123B456")
	if err == nil {
		t.Error("CheckDigit should error on invalid character")
	}
}

// TestVerifyCheckDigit verifies check digit validation.
func TestVerifyCheckDigit(t *testing.T) {
	// Generate valid codes with check digits
	testCodes := []string{"012", "0123456789", "ACDFGHJKMN"}

	for _, code := range testCodes {
		digit, err := CheckDigit(code)
		if err != nil {
			t.Fatalf("CheckDigit failed: %v", err)
		}

		codeWithCheck := code + string(digit)

		// Should verify as true
		valid, err := VerifyCheckDigit(codeWithCheck)
		if err != nil {
			t.Errorf("VerifyCheckDigit(%q) error: %v", codeWithCheck, err)
		}
		if !valid {
			t.Errorf("VerifyCheckDigit(%q) should be valid", codeWithCheck)
		}

		// Invalid check digit should fail
		if len(Alphabet) > 0 {
			wrongDigit := Alphabet[(charToIndex[digit]+1)%25]
			invalidCode := code + string(wrongDigit)
			valid, err := VerifyCheckDigit(invalidCode)
			if err != nil {
				t.Errorf("VerifyCheckDigit(%q) unexpected error: %v", invalidCode, err)
			}
			if valid {
				t.Errorf("VerifyCheckDigit(%q) should be invalid", invalidCode)
			}
		}
	}

	// Test error cases
	_, err := VerifyCheckDigit("0")
	if err == nil {
		t.Error("VerifyCheckDigit should error on single character")
	}

	_, err = VerifyCheckDigit("")
	if err == nil {
		t.Error("VerifyCheckDigit should error on empty string")
	}

	_, err = VerifyCheckDigit("0123B456")
	if err == nil {
		t.Error("VerifyCheckDigit should error on invalid character")
	}
}

// TestDistribution verifies that all 25 alphabet characters appear in 10000 generated characters.
func TestDistribution(t *testing.T) {
	charCount := make(map[byte]int)
	const totalChars = 10000
	const idLength = 100 // 100 chars * 100 IDs = 10000 chars

	for i := 0; i < totalChars/idLength; i++ {
		id, err := Generate(idLength)
		if err != nil {
			t.Fatalf("Generate failed: %v", err)
		}

		for j := 0; j < len(id); j++ {
			charCount[id[j]]++
		}
	}

	// Verify all 25 characters appear
	if len(charCount) != 25 {
		t.Errorf("Expected all 25 characters in distribution, got %d", len(charCount))
	}

	for i := 0; i < len(Alphabet); i++ {
		ch := Alphabet[i]
		if count, ok := charCount[ch]; !ok || count == 0 {
			t.Errorf("Character %c did not appear in 10000 generated characters", ch)
		} else {
			// Each character should appear roughly 400 times (10000/25)
			// Allow for significant variance but check it's reasonable
			if count < 200 || count > 600 {
				t.Logf("Character %c appeared %d times (expected ~400)", ch, count)
			}
		}
	}
}
