package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
)

type CurrencyService struct {
	db *sql.DB
}

func NewCurrencyService(db *sql.DB) *CurrencyService {
	return &CurrencyService{db: db}
}

// GetActiveCurrencies returns all active currencies
func (s *CurrencyService) GetActiveCurrencies() ([]models.Currency, error) {
	query := `
		SELECT id, code, name, symbol, flag_emoji, is_active, is_base, 
		       exchange_rate, last_updated, created_at, updated_at
		FROM currencies 
		WHERE is_active = true 
		ORDER BY is_base DESC, name ASC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var currencies []models.Currency
	for rows.Next() {
		var currency models.Currency
		err := rows.Scan(
			&currency.ID, &currency.Code, &currency.Name, &currency.Symbol,
			&currency.FlagEmoji, &currency.IsActive, &currency.IsBase,
			&currency.ExchangeRate, &currency.LastUpdated, &currency.CreatedAt, &currency.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		currencies = append(currencies, currency)
	}

	return currencies, nil
}

// GetAllCurrencies returns all currencies (for admin)
func (s *CurrencyService) GetAllCurrencies() ([]models.Currency, error) {
	query := `
		SELECT id, code, name, symbol, flag_emoji, is_active, is_base, 
		       exchange_rate, last_updated, created_at, updated_at
		FROM currencies 
		ORDER BY is_base DESC, name ASC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var currencies []models.Currency
	for rows.Next() {
		var currency models.Currency
		err := rows.Scan(
			&currency.ID, &currency.Code, &currency.Name, &currency.Symbol,
			&currency.FlagEmoji, &currency.IsActive, &currency.IsBase,
			&currency.ExchangeRate, &currency.LastUpdated, &currency.CreatedAt, &currency.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		currencies = append(currencies, currency)
	}

	return currencies, nil
}

// GetCurrencyByCode returns currency by code
func (s *CurrencyService) GetCurrencyByCode(code string) (*models.Currency, error) {
	query := `
		SELECT id, code, name, symbol, flag_emoji, is_active, is_base, 
		       exchange_rate, last_updated, created_at, updated_at
		FROM currencies 
		WHERE code = $1
	`

	var currency models.Currency
	err := s.db.QueryRow(query, code).Scan(
		&currency.ID, &currency.Code, &currency.Name, &currency.Symbol,
		&currency.FlagEmoji, &currency.IsActive, &currency.IsBase,
		&currency.ExchangeRate, &currency.LastUpdated, &currency.CreatedAt, &currency.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &currency, nil
}

// GetBaseCurrency returns the base currency
func (s *CurrencyService) GetBaseCurrency() (*models.Currency, error) {
	query := `
		SELECT id, code, name, symbol, flag_emoji, is_active, is_base, 
		       exchange_rate, last_updated, created_at, updated_at
		FROM currencies 
		WHERE is_base = true
	`

	var currency models.Currency
	err := s.db.QueryRow(query).Scan(
		&currency.ID, &currency.Code, &currency.Name, &currency.Symbol,
		&currency.FlagEmoji, &currency.IsActive, &currency.IsBase,
		&currency.ExchangeRate, &currency.LastUpdated, &currency.CreatedAt, &currency.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &currency, nil
}

// ConvertCurrency converts amount from one currency to another
func (s *CurrencyService) ConvertCurrency(fromCode, toCode string, amount float64) (*models.CurrencyConversionResponse, error) {
	// Get both currencies
	fromCurrency, err := s.GetCurrencyByCode(fromCode)
	if err != nil {
		return nil, fmt.Errorf("from currency not found: %v", err)
	}

	toCurrency, err := s.GetCurrencyByCode(toCode)
	if err != nil {
		return nil, fmt.Errorf("to currency not found: %v", err)
	}

	// If same currency, return as is
	if fromCode == toCode {
		return &models.CurrencyConversionResponse{
			FromCurrency:    fromCode,
			ToCurrency:      toCode,
			OriginalAmount:  amount,
			ConvertedAmount: amount,
			ExchangeRate:    1.0,
			LastUpdated:     fromCurrency.LastUpdated,
		}, nil
	}

	// Convert to base currency first, then to target currency
	var convertedAmount float64
	var exchangeRate float64

	if fromCurrency.IsBase {
		// From base to target
		convertedAmount = amount * toCurrency.ExchangeRate
		exchangeRate = toCurrency.ExchangeRate
	} else if toCurrency.IsBase {
		// From source to base
		convertedAmount = amount / fromCurrency.ExchangeRate
		exchangeRate = 1.0 / fromCurrency.ExchangeRate
	} else {
		// From source to base to target
		baseAmount := amount / fromCurrency.ExchangeRate
		convertedAmount = baseAmount * toCurrency.ExchangeRate
		exchangeRate = toCurrency.ExchangeRate / fromCurrency.ExchangeRate
	}

	return &models.CurrencyConversionResponse{
		FromCurrency:    fromCode,
		ToCurrency:      toCode,
		OriginalAmount:  amount,
		ConvertedAmount: convertedAmount,
		ExchangeRate:    exchangeRate,
		LastUpdated:     toCurrency.LastUpdated,
	}, nil
}

// UpdateExchangeRates fetches latest rates from ExchangeRate API and updates database
func (s *CurrencyService) UpdateExchangeRates() error {
	apiKey := os.Getenv("EXCHANGE_RATE_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("EXCHANGE_RATE_API_KEY not set")
	}

	// Get base currency
	baseCurrency, err := s.GetBaseCurrency()
	if err != nil {
		return fmt.Errorf("failed to get base currency: %v", err)
	}

	// Fetch rates from API
	url := fmt.Sprintf("https://v6.exchangerate-api.com/v6/%s/latest/%s", apiKey, baseCurrency.Code)
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("failed to fetch exchange rates: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %v", err)
	}

	var apiResponse models.ExchangeRateAPIResponse
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		return fmt.Errorf("failed to parse API response: %v", err)
	}

	if apiResponse.Result != "success" {
		return fmt.Errorf("API returned error: %s", apiResponse.Result)
	}

	// Update exchange rates in database
	now := time.Now()

	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %v", err)
	}
	defer tx.Rollback()

	// Update each currency
	for code, rate := range apiResponse.ConversionRates {
		// Skip base currency
		if code == baseCurrency.Code {
			continue
		}

		query := `
			UPDATE currencies 
			SET exchange_rate = $1, last_updated = $2, updated_at = $3
			WHERE code = $4
		`

		_, err := tx.Exec(query, rate, now, now, code)
		if err != nil {
			return fmt.Errorf("failed to update currency %s: %v", code, err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

// CreateCurrency creates a new currency (admin only)
func (s *CurrencyService) CreateCurrency(currency *models.Currency) error {
	query := `
		INSERT INTO currencies (code, name, symbol, flag_emoji, is_active, is_base, exchange_rate)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	err := s.db.QueryRow(query,
		currency.Code,
		currency.Name,
		currency.Symbol,
		currency.FlagEmoji,
		currency.IsActive,
		currency.IsBase,
		currency.ExchangeRate,
	).Scan(&currency.ID, &currency.CreatedAt, &currency.UpdatedAt)

	return err
}

// UpdateCurrency updates currency (admin only)
func (s *CurrencyService) UpdateCurrency(currency *models.Currency) error {
	query := `
		UPDATE currencies 
		SET name = $1, symbol = $2, flag_emoji = $3, is_active = $4, 
		    is_base = $5, exchange_rate = $6, updated_at = NOW()
		WHERE code = $7
		RETURNING id, last_updated, created_at, updated_at
	`

	err := s.db.QueryRow(query,
		currency.Name,
		currency.Symbol,
		currency.FlagEmoji,
		currency.IsActive,
		currency.IsBase,
		currency.ExchangeRate,
		currency.Code,
	).Scan(&currency.ID, &currency.LastUpdated, &currency.CreatedAt, &currency.UpdatedAt)

	return err
}

// DeleteCurrency deletes currency (admin only)
func (s *CurrencyService) DeleteCurrency(code string) error {
	query := `DELETE FROM currencies WHERE code = $1`
	_, err := s.db.Exec(query, code)
	return err
}

// SetBaseCurrency sets a currency as base and updates all other rates
func (s *CurrencyService) SetBaseCurrency(code string) error {
	// Get the new base currency
	newBase, err := s.GetCurrencyByCode(code)
	if err != nil {
		return fmt.Errorf("currency not found: %v", err)
	}

	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %v", err)
	}
	defer tx.Rollback()

	// Set all currencies to non-base
	_, err = tx.Exec("UPDATE currencies SET is_base = false, updated_at = NOW()")
	if err != nil {
		return fmt.Errorf("failed to clear base currencies: %v", err)
	}

	// Set new base currency
	_, err = tx.Exec("UPDATE currencies SET is_base = true, exchange_rate = 1.0, updated_at = NOW() WHERE code = $1", code)
	if err != nil {
		return fmt.Errorf("failed to set new base currency: %v", err)
	}

	// Update all other currencies relative to new base
	otherCurrencies, err := s.GetActiveCurrencies()
	if err != nil {
		return fmt.Errorf("failed to get currencies: %v", err)
	}

	for _, currency := range otherCurrencies {
		if currency.Code == code {
			continue
		}

		// Calculate new exchange rate
		newRate := currency.ExchangeRate / newBase.ExchangeRate

		_, err = tx.Exec("UPDATE currencies SET exchange_rate = $1, updated_at = NOW() WHERE code = $2",
			newRate, currency.Code)
		if err != nil {
			return fmt.Errorf("failed to update currency %s: %v", currency.Code, err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}
