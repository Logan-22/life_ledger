# Example API usage with curl/PowerShell

## Categories

# List all categories
Invoke-RestMethod -Uri "http://localhost:5000/api/categories" -Method Get

# Create a new category
$body = @{
    name = "Learning"
    description = "Track books, courses, and learning activities"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/categories" -Method Post -Body $body -ContentType "application/json"

## Habits

# Create a habit
$body = @{
    name = "Morning Exercise"
    description = "30 minutes of exercise every morning"
    frequency = "daily"
    target_count = 1
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/habits" -Method Post -Body $body -ContentType "application/json"

# List all habits
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/habits" -Method Get

# Get specific habit with streak info
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/habits/1" -Method Get

# Log habit completion
$body = @{
    notes = "Completed morning run"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/habits/1/log" -Method Post -Body $body -ContentType "application/json"

## Diet

# Create diet entry
$body = @{
    meal_type = "breakfast"
    food_item = "Oatmeal with fruits"
    description = "Bowl of oatmeal with banana and berries"
    calories = 350
    protein = 12.5
    carbs = 58.0
    fats = 8.5
    notes = "Felt energized"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/diet" -Method Post -Body $body -ContentType "application/json"

# List all diet entries
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/diet" -Method Get

# Filter by meal type
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/diet?meal_type=breakfast" -Method Get

# Get diet summary
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/diet/summary" -Method Get
