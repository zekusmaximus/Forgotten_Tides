#!/usr/bin/env python3

import json
import jsonschema
from pathlib import Path
import sys

def validate_example(example_path, schema_path):
    """Validate an example JSON file against its schema"""
    try:
        # Load the schema and example
        with open(schema_path, 'r') as f:
            schema = json.load(f)

        with open(example_path, 'r') as f:
            example = json.load(f)

        # Validate
        jsonschema.validate(instance=example, schema=schema)
        print(f"✓ {example_path} validates against {schema_path}")
        return True

    except jsonschema.ValidationError as e:
        print(f"✗ {example_path} failed validation: {e.message}")
        return False
    except Exception as e:
        print(f"✗ Error validating {example_path}: {str(e)}")
        return False

def main():
    # Define schema-example pairs
    validations = [
        ("docs/schemas/examples/character_example.json", "docs/schemas/character.schema.json"),
        ("docs/schemas/examples/location_example.json", "docs/schemas/location.schema.json"),
        ("docs/schemas/examples/faction_example.json", "docs/schemas/faction.schema.json"),
        ("docs/schemas/examples/mechanics_example.json", "docs/schemas/mechanics_rule.schema.json"),
        ("docs/schemas/examples/story_example.json", "docs/schemas/story.schema.json")
    ]

    all_valid = True

    print("Validating examples against schemas...")
    print("=" * 50)

    for example_path, schema_path in validations:
        if not validate_example(example_path, schema_path):
            all_valid = False

    print("=" * 50)
    if all_valid:
        print("✓ All examples validated successfully!")
        return 0
    else:
        print("✗ Some examples failed validation")
        return 1

if __name__ == "__main__":
    sys.exit(main())