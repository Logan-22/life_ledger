"""Nutrition API integration using RapidAPI BonAppetee."""
import http.client
import json
import os


class NutritionAPI:
    """Wrapper for BonAppetee nutrition data API."""
    
    def __init__(self):
        self.rapidapi_key = os.getenv('RAPIDAPI_KEY', '80cc30ee31mshcd21525840546bdp157a45jsnf21911d55de1')
        self.rapidapi_host = "bonhappetee-food-nutrition-api2.p.rapidapi.com"
    
    def search_food(self, query):
        """
        Search for food using BonAppetee API.
        
        Args:
            query: Food name to search
            
        Returns:
            List of food items with nutrition data
        """
        try:
            conn = http.client.HTTPSConnection(self.rapidapi_host)
            
            headers = {
                'x-rapidapi-key': self.rapidapi_key,
                'x-rapidapi-host': self.rapidapi_host
            }
            
            # URL encode the query
            encoded_query = query.replace(' ', '%20')
            conn.request("GET", f"/search?value={encoded_query}", headers=headers)
            
            res = conn.getresponse()
            data = res.read()
            
            if res.status == 200:
                response_data = json.loads(data.decode("utf-8"))
                items = response_data.get('items', [])
                
                # Transform the data to our format
                results = []
                for item in items:
                    nutrients = item.get('nutrients', {})
                    
                    # Calculate detailed nutrients (BonAppetee provides basic ones)
                    fats = nutrients.get('fats', 0)
                    carbs = nutrients.get('carbs', 0)
                    protein = nutrients.get('protein', 0)
                    calories = nutrients.get('calories', 0)
                    
                    result = {
                        'food_id': item.get('food_id'),
                        'food_unique_id': item.get('food_unique_id'),
                        'food_name': item.get('food_name', query),
                        'common_names': item.get('common_names', ''),
                        'meal_type': item.get('meal_type', ''),
                        'serving_type': item.get('serving_type', ''),
                        'serving_size': round(item.get('basic_unit_measure', 100), 2),
                        'calories': round(calories, 2),
                        'protein': round(protein, 2),
                        'carbs': round(carbs, 2),
                        'fats': round(fats, 2),
                        # Estimated detailed nutrients based on typical food composition
                        'sugar': round(carbs * 0.15, 2),  # Estimate 15% of carbs as sugar
                        'fiber': round(carbs * 0.08, 2),  # Estimate 8% of carbs as fiber
                        'saturated_fat': round(fats * 0.35, 2),  # Estimate 35% of fats as saturated
                        'unsaturated_fat': round(fats * 0.65, 2),  # Estimate 65% of fats as unsaturated
                        'calcium': round(protein * 15, 2),  # Rough estimate
                        'iron': round(protein * 1.5, 2),  # Rough estimate
                        'magnesium': round(protein * 10, 2),  # Rough estimate
                        'sodium': round(calories * 0.5, 2),  # Rough estimate
                        'potassium': round(calories * 1.2, 2),  # Rough estimate
                        'source': 'BonAppetee API'
                    }
                    results.append(result)
                
                return {
                    'success': True,
                    'results': results,
                    'total_results': response_data.get('results', len(results)),
                    'page': response_data.get('page', 1),
                    'pages': response_data.get('pages', 1)
                }
            else:
                print(f"BonAppetee API error: Status {res.status}")
                return {
                    'success': False,
                    'results': [],
                    'error': f'API returned status {res.status}'
                }
                
        except Exception as e:
            print(f"BonAppetee API error: {e}")
            return {
                'success': False,
                'results': [],
                'error': str(e)
            }
    
    def get_food_by_id(self, food_id, quantity=1):
        """
        Get specific food item by ID with custom quantity.
        
        Args:
            food_id: The food_unique_id from search results
            quantity: Number of servings
            
        Returns:
            Dict with nutrition data adjusted for quantity
        """
        # Note: BonAppetee doesn't have a direct get-by-id endpoint
        # We'll search and find the item by caching or re-searching
        return {
            'success': False,
            'error': 'Get by ID not implemented yet'
        }
    
    def lookup_food(self, food_name):
        """
        Main method to lookup food nutrition.
        Returns list of matching foods for user to choose from.
        
        Args:
            food_name: Food name to search
            
        Returns:
            Dict with list of results or error
        """
        return self.search_food(food_name)


# Global instance
nutrition_api = NutritionAPI()
