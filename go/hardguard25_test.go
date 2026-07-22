package hardguard25

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

type conformanceFixture struct {
	Normalize []struct {
		Input  string `json:"input"`
		Output string `json:"output"`
	} `json:"normalize"`
	Validate []struct {
		Input string `json:"input"`
		Valid bool   `json:"valid"`
	} `json:"validate"`
	CheckDigit []struct {
		Code  string `json:"code"`
		Digit string `json:"digit"`
	} `json:"check_digit"`
	Verify []struct {
		Input string `json:"input"`
		Valid bool   `json:"valid"`
	} `json:"verify"`
	ExcludedCharacters []string `json:"excluded_characters"`
	NonASCIIRejection  []string `json:"non_ascii_rejection"`
	Separators         []struct {
		Input  string `json:"input"`
		Output string `json:"output"`
	} `json:"separators"`
	SingleSubstitutionChecks []struct {
		Code       string `json:"code"`
		CheckDigit string `json:"check_digit"`
		Caught     int    `json:"caught"`
		Total      int    `json:"total"`
	} `json:"single_substitution_checks"`
	AdjacentTranspositionChecks []struct {
		Code       string `json:"code"`
		CheckDigit string `json:"check_digit"`
		Caught     int    `json:"caught"`
		Total      int    `json:"total"`
	} `json:"adjacent_transposition_checks"`
	DeterministicGeneration []struct {
		BytesHex string `json:"bytes_hex"`
		Length   int    `json:"length"`
		Output   string `json:"output"`
	} `json:"deterministic_generation"`
}

func loadConformanceFixture(t *testing.T) conformanceFixture {
	t.Helper()

	data, err := os.ReadFile(filepath.Join("..", "conformance", "vectors.json"))
	if err != nil {
		t.Fatalf("failed to read conformance vectors: %v", err)
	}

	var fixture conformanceFixture
	if err := json.Unmarshal(data, &fixture); err != nil {
		t.Fatalf("failed to parse conformance vectors: %v", err)
	}

	return fixture
}

func deterministicGenerate(t *testing.T, bytesHex string, length int) string {
	t.Helper()

	fields := strings.Fields(bytesHex)
	result := make([]byte, 0, length)
	for _, field := range fields {
		var b byte
		if _, err := fmt.Sscanf(field, "%02x", &b); err != nil {
			t.Fatalf("failed to parse byte %q: %v", field, err)
		}
		if b < 225 {
			result = append(result, Alphabet[b%25])
		}
		if len(result) == length {
			return string(result)
		}
	}

	t.Fatalf("not enough accepted bytes in deterministic vector")
	return ""
}

func countCaughtSingleSubstitutions(t *testing.T, code string, digit byte) (int, int) {
	t.Helper()

	caught := 0
	total := 0
	for i := 0; i < len(code); i++ {
		for j := 0; j < len(Alphabet); j++ {
			if Alphabet[j] == code[i] {
				continue
			}
			total++
			mutated := code[:i] + string(Alphabet[j]) + code[i+1:] + string(digit)
			valid, _ := VerifyCheckDigit(mutated)
			if !valid {
				caught++
			}
		}
	}

	return caught, total
}

func countCaughtAdjacentTranspositions(t *testing.T, code string, digit byte) (int, int) {
	t.Helper()

	caught := 0
	total := 0
	for i := 0; i < len(code)-1; i++ {
		if code[i] == code[i+1] {
			continue
		}
		total++
		mutated := code[:i] + string(code[i+1]) + string(code[i]) + code[i+2:] + string(digit)
		valid, _ := VerifyCheckDigit(mutated)
		if !valid {
			caught++
		}
	}

	return caught, total
}

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
	fixture := loadConformanceFixture(t)
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

	for _, vector := range fixture.Validate {
		tests = append(tests, struct {
			name  string
			input string
			valid bool
		}{
			name:  "Conformance " + vector.Input,
			input: vector.Input,
			valid: vector.Valid,
		})
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
	fixture := loadConformanceFixture(t)
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{"Simple ID", "0123456789", "0123456789", false},
		{"With hyphens", "0123-4567-89", "0123456789", false},
		{"With spaces", "0123 4567 89", "0123456789", false},
		{"With tabs and newlines", "0123\t4567\n89", "0123456789", false},
		{"With underscores", "0123_4567_89", "0123456789", false},
		{"With dots", "0123.4567.89", "0123456789", false},
		{"With leading/trailing space", "  0123456789  ", "0123456789", false},
		{"Lowercase", "acdfghkm", "ACDFGHKM", false},
		{"Mixed separators", "01-23_45.67 89", "0123456789", false},
		{"Invalid character", "0123B456789", "", true},
		{"Invalid character O", "0123O456789", "", true},
	}

	for _, vector := range fixture.Normalize {
		tests = append(tests, struct {
			name    string
			input   string
			want    string
			wantErr bool
		}{
			name:    "Conformance " + vector.Input,
			input:   vector.Input,
			want:    vector.Output,
			wantErr: false,
		})
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

	for _, vector := range fixture.Separators {
		t.Run("Separator "+vector.Input, func(t *testing.T) {
			got, err := Normalize(vector.Input)
			if err != nil {
				t.Fatalf("Normalize(%q) returned error: %v", vector.Input, err)
			}
			if got != vector.Output {
				t.Errorf("Normalize(%q) = %q, want %q", vector.Input, got, vector.Output)
			}
		})
	}
}

// TestCheckDigit verifies check digit computation.
func TestCheckDigit(t *testing.T) {
	fixture := loadConformanceFixture(t)
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

	lowerDigit, err := CheckDigit("acdfghjkmnpruwy")
	if err != nil {
		t.Fatalf("CheckDigit should accept lowercase input: %v", err)
	}
	upperDigit, err := CheckDigit("ACDFGHJKMNPRUWY")
	if err != nil {
		t.Fatalf("CheckDigit failed on uppercase input: %v", err)
	}
	if lowerDigit != upperDigit {
		t.Errorf("CheckDigit should be case-insensitive: got %c and %c", lowerDigit, upperDigit)
	}

	for _, vector := range fixture.CheckDigit {
		digit, err := CheckDigit(vector.Code)
		if err != nil {
			t.Fatalf("CheckDigit(%q) returned error: %v", vector.Code, err)
		}
		if string(digit) != vector.Digit {
			t.Errorf("CheckDigit(%q) = %q, want %q", vector.Code, string(digit), vector.Digit)
		}
	}

	// Test with invalid character
	_, err = CheckDigit("0123B456")
	if err == nil {
		t.Error("CheckDigit should error on invalid character")
	}
}

// TestVerifyCheckDigit verifies check digit validation.
func TestVerifyCheckDigit(t *testing.T) {
	fixture := loadConformanceFixture(t)
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

		split := len(code) / 2
		formatted := strings.ToLower(code[:split] + "-" + code[split:] + "-" + string(digit))
		valid, err = VerifyCheckDigit(formatted)
		if err != nil {
			t.Errorf("VerifyCheckDigit(%q) should normalize formatted input: %v", formatted, err)
		}
		if !valid {
			t.Errorf("VerifyCheckDigit(%q) should be valid after normalization", formatted)
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

	for _, vector := range fixture.Verify {
		valid, err := VerifyCheckDigit(vector.Input)
		if vector.Valid && err != nil {
			t.Fatalf("VerifyCheckDigit(%q) returned error: %v", vector.Input, err)
		}
		if valid != vector.Valid {
			t.Errorf("VerifyCheckDigit(%q) = %v, want %v", vector.Input, valid, vector.Valid)
		}
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

func TestExpandedConformance(t *testing.T) {
	fixture := loadConformanceFixture(t)

	t.Run("ExcludedCharacters", func(t *testing.T) {
		for _, char := range fixture.ExcludedCharacters {
			input := "ACD" + char + "123"
			if Validate(input) {
				t.Errorf("Validate(%q) should reject excluded character", input)
			}
			if _, err := Normalize(input); err == nil {
				t.Errorf("Normalize(%q) should error on excluded character", input)
			}
		}
	})

	t.Run("NonASCIIRejection", func(t *testing.T) {
		for _, input := range fixture.NonASCIIRejection {
			if Validate(input) {
				t.Errorf("Validate(%q) should reject non-ASCII input", input)
			}
			if _, err := Normalize(input); err == nil {
				t.Errorf("Normalize(%q) should reject non-ASCII input", input)
			}
			if _, err := CheckDigit(input); err == nil {
				t.Errorf("CheckDigit(%q) should reject non-ASCII input", input)
			}
		}

		for i := 0; i < len(Alphabet); i++ {
			input := string(rune(0x100) + rune(Alphabet[i]))
			if _, err := Normalize(input); err == nil {
				t.Errorf("Normalize(%q) should reject a non-ASCII low-byte collision", input)
			}
			if _, err := CheckDigit(input); err == nil {
				t.Errorf("CheckDigit(%q) should reject a non-ASCII low-byte collision", input)
			}
		}
	})

	t.Run("SingleSubstitutionProfiles", func(t *testing.T) {
		for _, vector := range fixture.SingleSubstitutionChecks {
			digit, err := CheckDigit(vector.Code)
			if err != nil {
				t.Fatalf("CheckDigit(%q) returned error: %v", vector.Code, err)
			}
			if string(digit) != vector.CheckDigit {
				t.Fatalf("CheckDigit(%q) = %q, want %q", vector.Code, string(digit), vector.CheckDigit)
			}
			caught, total := countCaughtSingleSubstitutions(t, vector.Code, digit)
			if caught != vector.Caught || total != vector.Total {
				t.Errorf("single substitutions for %q caught/total = %d/%d, want %d/%d", vector.Code, caught, total, vector.Caught, vector.Total)
			}
		}
	})

	t.Run("AdjacentTranspositionProfiles", func(t *testing.T) {
		for _, vector := range fixture.AdjacentTranspositionChecks {
			digit, err := CheckDigit(vector.Code)
			if err != nil {
				t.Fatalf("CheckDigit(%q) returned error: %v", vector.Code, err)
			}
			if string(digit) != vector.CheckDigit {
				t.Fatalf("CheckDigit(%q) = %q, want %q", vector.Code, string(digit), vector.CheckDigit)
			}
			caught, total := countCaughtAdjacentTranspositions(t, vector.Code, digit)
			if caught != vector.Caught || total != vector.Total {
				t.Errorf("adjacent transpositions for %q caught/total = %d/%d, want %d/%d", vector.Code, caught, total, vector.Caught, vector.Total)
			}
		}
	})

	t.Run("DeterministicGeneration", func(t *testing.T) {
		for _, vector := range fixture.DeterministicGeneration {
			got := deterministicGenerate(t, vector.BytesHex, vector.Length)
			if got != vector.Output {
				t.Errorf("deterministicGenerate(%q, %d) = %q, want %q", vector.BytesHex, vector.Length, got, vector.Output)
			}
		}
	})
}
