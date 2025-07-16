#!/bin/bash

echo "🔧 Firebase Private Key Formatter"
echo "=================================="
echo ""
echo "This script helps format Firebase private keys correctly for environment variables."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found in current directory"
    echo "Please run this script from your project root directory"
    exit 1
fi

# Function to format private key
format_private_key() {
    local key_file="$1"
    
    if [ ! -f "$key_file" ]; then
        echo "❌ File not found: $key_file"
        return 1
    fi
    
    echo "📝 Formatting private key from: $key_file"
    
    # Read the key and escape newlines
    local formatted_key=$(cat "$key_file" | sed ':a;N;$!ba;s/\n/\\n/g')
    
    # Update .env file
    if grep -q "FIREBASE_PRIVATE_KEY=" .env; then
        # Replace existing key
        sed -i.bak "s|FIREBASE_PRIVATE_KEY=.*|FIREBASE_PRIVATE_KEY=\"$formatted_key\"|" .env
        echo "✅ Updated existing FIREBASE_PRIVATE_KEY in .env"
    else
        # Add new key
        echo "FIREBASE_PRIVATE_KEY=\"$formatted_key\"" >> .env
        echo "✅ Added FIREBASE_PRIVATE_KEY to .env"
    fi
    
    echo "🔄 Private key has been formatted and added to .env file"
}

# Function to validate current key format
validate_current_key() {
    if grep -q "FIREBASE_PRIVATE_KEY=" .env; then
        local current_key=$(grep "FIREBASE_PRIVATE_KEY=" .env | cut -d'=' -f2- | tr -d '"')
        
        if [[ "$current_key" == *"-----BEGIN PRIVATE KEY-----"* ]] && [[ "$current_key" == *"-----END PRIVATE KEY-----"* ]]; then
            echo "✅ Current private key appears to be properly formatted"
            
            # Check for common formatting issues
            if [[ "$current_key" != *"\\n"* ]]; then
                echo "⚠️  Warning: Key may be missing newline escapes"
                echo "   This could cause 'Invalid PEM formatted message' errors"
            fi
        else
            echo "❌ Current private key appears to be malformed"
            echo "   Missing BEGIN/END markers"
        fi
    else
        echo "❌ FIREBASE_PRIVATE_KEY not found in .env file"
    fi
}

# Function to fix key directly from Firebase console JSON
fix_from_json() {
    local json_file="$1"
    
    if [ ! -f "$json_file" ]; then
        echo "❌ JSON file not found: $json_file"
        return 1
    fi
    
    echo "📝 Extracting private key from Firebase service account JSON: $json_file"
    
    # Extract private key from JSON and format it
    local private_key=$(cat "$json_file" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'private_key' in data:
    # Escape newlines for shell
    key = data['private_key'].replace('\n', '\\\\n')
    print(key)
else:
    print('ERROR: private_key not found in JSON')
    sys.exit(1)
")
    
    if [[ "$private_key" == "ERROR:"* ]]; then
        echo "❌ $private_key"
        return 1
    fi
    
    # Update .env file
    if grep -q "FIREBASE_PRIVATE_KEY=" .env; then
        sed -i.bak "s|FIREBASE_PRIVATE_KEY=.*|FIREBASE_PRIVATE_KEY=\"$private_key\"|" .env
        echo "✅ Updated FIREBASE_PRIVATE_KEY in .env from JSON"
    else
        echo "FIREBASE_PRIVATE_KEY=\"$private_key\"" >> .env
        echo "✅ Added FIREBASE_PRIVATE_KEY to .env from JSON"
    fi
    
    # Also extract other credentials
    local project_id=$(cat "$json_file" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('project_id', ''))")
    local client_email=$(cat "$json_file" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('client_email', ''))")
    
    if [ -n "$project_id" ]; then
        if grep -q "FIREBASE_PROJECT_ID=" .env; then
            sed -i.bak "s|FIREBASE_PROJECT_ID=.*|FIREBASE_PROJECT_ID=$project_id|" .env
        else
            echo "FIREBASE_PROJECT_ID=$project_id" >> .env
        fi
        echo "✅ Updated FIREBASE_PROJECT_ID: $project_id"
    fi
    
    if [ -n "$client_email" ]; then
        if grep -q "FIREBASE_CLIENT_EMAIL=" .env; then
            sed -i.bak "s|FIREBASE_CLIENT_EMAIL=.*|FIREBASE_CLIENT_EMAIL=$client_email|" .env
        else
            echo "FIREBASE_CLIENT_EMAIL=$client_email" >> .env
        fi
        echo "✅ Updated FIREBASE_CLIENT_EMAIL: $client_email"
    fi
}

# Main menu
echo "What would you like to do?"
echo ""
echo "1) Validate current Firebase key in .env"
echo "2) Format private key from .pem/.key file"
echo "3) Extract and format from Firebase service account JSON"
echo "4) Show current .env Firebase variables"
echo "5) Exit"
echo ""
read -p "Choose an option (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🔍 Validating current Firebase configuration..."
        validate_current_key
        ;;
    2)
        echo ""
        read -p "Enter path to private key file (.pem/.key): " key_file
        format_private_key "$key_file"
        ;;
    3)
        echo ""
        read -p "Enter path to Firebase service account JSON file: " json_file
        fix_from_json "$json_file"
        ;;
    4)
        echo ""
        echo "📋 Current Firebase environment variables:"
        echo "========================================"
        grep "FIREBASE_" .env || echo "No Firebase variables found"
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🚀 Next steps:"
echo "1. Copy your updated .env file to your production server"
echo "2. Restart your backend service: pm2 restart zootel-backend"
echo "3. Check logs: pm2 logs zootel-backend"
echo ""
echo "💡 Common deployment commands:"
echo "   scp .env root@31.187.72.39:/var/www/zootel/"
echo "   ssh root@31.187.72.39 'cd /var/www/zootel && pm2 restart zootel-backend'"
echo "" 