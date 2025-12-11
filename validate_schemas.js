#!/usr/bin/env node

const fs = require('fs');
const Ajv = require('ajv');
const ajv = new Ajv({ strict: false });

// Define schema-example pairs
const validations = [
    {
        example: 'docs/schemas/examples/character_example.json',
        schema: 'docs/schemas/character.schema.json',
        name: 'Character'
    },
    {
        example: 'docs/schemas/examples/location_example.json',
        schema: 'docs/schemas/location.schema.json',
        name: 'Location'
    },
    {
        example: 'docs/schemas/examples/faction_example.json',
        schema: 'docs/schemas/faction.schema.json',
        name: 'Faction'
    },
    {
        example: 'docs/schemas/examples/mechanics_example.json',
        schema: 'docs/schemas/mechanics_rule.schema.json',
        name: 'Mechanics Rule'
    },
    {
        example: 'docs/schemas/examples/story_example.json',
        schema: 'docs/schemas/story.schema.json',
        name: 'Story'
    }
];

console.log('Validating examples against schemas...');
console.log('='.repeat(50));

let allValid = true;

// Load and compile all schemas first
const schemas = {};
for (const validation of validations) {
    try {
        const schemaContent = fs.readFileSync(validation.schema, 'utf8');
        schemas[validation.schema] = JSON.parse(schemaContent);
        ajv.addSchema(schemas[validation.schema], validation.schema);
    } catch (error) {
        console.error(`✗ Failed to load schema ${validation.schema}: ${error.message}`);
        allValid = false;
    }
}

// Validate each example
for (const validation of validations) {
    try {
        const exampleContent = fs.readFileSync(validation.example, 'utf8');
        const exampleData = JSON.parse(exampleContent);

        const validate = ajv.getSchema(validation.schema);
        if (!validate) {
            console.error(`✗ No schema found for ${validation.schema}`);
            allValid = false;
            continue;
        }

        const valid = validate(exampleData);
        if (valid) {
            console.log(`✓ ${validation.name} example validates against schema`);
        } else {
            console.error(`✗ ${validation.name} example failed validation:`);
            if (validate.errors) {
                validate.errors.forEach(error => {
                    console.error(`  - ${error.instancePath || 'root'}: ${error.message}`);
                });
            }
            allValid = false;
        }
    } catch (error) {
        console.error(`✗ Error validating ${validation.example}: ${error.message}`);
        allValid = false;
    }
}

console.log('='.repeat(50));
if (allValid) {
    console.log('✓ All examples validated successfully!');
    process.exit(0);
} else {
    console.log('✗ Some examples failed validation');
    process.exit(1);
}