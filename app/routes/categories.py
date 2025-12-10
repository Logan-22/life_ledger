from flask import Blueprint, request, jsonify
from app import db
from app.models import Category
from datetime import datetime

categories_bp = Blueprint('categories', __name__)


@categories_bp.route('', methods=['GET'])
def get_categories():
    """Get all categories."""
    categories = Category.query.all()
    return jsonify([cat.to_dict() for cat in categories])


@categories_bp.route('', methods=['POST'])
def create_category():
    """Create a new category."""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400
    
    # Check if category already exists
    existing = Category.query.filter_by(name=data['name']).first()
    if existing:
        return jsonify({'error': 'Category already exists'}), 400
    
    category = Category(
        name=data['name'],
        description=data.get('description', '')
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify(category.to_dict()), 201


@categories_bp.route('/<int:id>', methods=['GET'])
def get_category(id):
    """Get a specific category."""
    category = Category.query.get_or_404(id)
    return jsonify(category.to_dict())


@categories_bp.route('/<int:id>', methods=['PUT'])
def update_category(id):
    """Update a category."""
    category = Category.query.get_or_404(id)
    data = request.get_json()
    
    if 'name' in data:
        # Check if new name conflicts with existing category
        existing = Category.query.filter_by(name=data['name']).first()
        if existing and existing.id != id:
            return jsonify({'error': 'Category name already exists'}), 400
        category.name = data['name']
    
    if 'description' in data:
        category.description = data['description']
    
    category.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(category.to_dict())


@categories_bp.route('/<int:id>', methods=['DELETE'])
def delete_category(id):
    """Delete a category."""
    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'message': 'Category deleted successfully'}), 200
