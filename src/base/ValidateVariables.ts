/**
 * Validates the provided variables against the expected types.
 *
 * @param variables - The variables to validate. This is an object where each key is the name of a variable and the value is the value of the variable.
 * @param variableTypeMappings - An object that maps variable names to their expected types. The expected type can be a string representing a primitive type, an array of possible values, or an object mapping property names to their expected types.
 *
 * @throws Will throw an error if any of the variables do not match their expected types. The error message will include the names of the invalid variables and their expected types.
 */
export function validateVariables (variables: any, variableTypeMappings: { [key: string]: any }) {
  if (Object.keys(variables).length === 0) {
    throw new Error('No variables were provided')
  }

  const errors = []

  for (const [variable, value] of Object.entries(variables)) {
    const expectedType = variableTypeMappings[variable]
    if (expectedType) {
      if (Array.isArray(expectedType)) {
        // If the expected type is an array, check if the value or its elements are included in the array
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (!expectedType.includes(item)) {
              errors.push(`Invalid ${variable}[${index}]: ${item}. Expected one of: ${expectedType.join(', ')}`)
            }
          })
        } else if (!expectedType.includes(value)) {
          errors.push(`Invalid ${variable}: ${value}. Expected one of: ${expectedType.join(', ')}`)
        }
      } else if (typeof expectedType === 'string' && expectedType.endsWith('[]')) {
        // If the expected type is an array type, check if the actual value is an array and if its elements are of the correct type
        const elementType = expectedType.slice(0, -2); // Remove the '[]' from the end
        if (!Array.isArray(value) || !value.every((element: any) => typeof element === elementType)) {
          errors.push(`Invalid ${variable}: ${value}. Expected type: ${expectedType}`);
        }
      } else if (typeof expectedType === 'object') {
        // If the expected type is an object, validate its properties
        if (Array.isArray(value)) {
          // If the value is an array, validate each object in the array
          value.forEach((item, index) => {
            for (const [prop, propValue] of Object.entries(item as object)) {
              const expectedPropType = expectedType[prop as keyof typeof expectedType]
              if (expectedPropType) {
                if (expectedPropType === 'boolean' && typeof propValue === 'boolean') {
                  // If the expected type is 'boolean' and the value is a boolean, the validation passes
                } else if (!expectedPropType.includes(propValue)) {
                  let expectedPropTypeString
                  if (Array.isArray(expectedPropType)) {
                    expectedPropTypeString = expectedPropType.join(', ')
                  } else {
                    expectedPropTypeString = expectedPropType.toString()
                  }
                  errors.push(`Invalid ${variable}[${index}].${prop}: ${propValue}. Expected one of: ${expectedPropTypeString}`)
                }
              }
            }
          })
        } else {
          // If the value is not an array, validate its properties
          for (const [prop, propValue] of Object.entries(value as object)) {
            const expectedPropType = expectedType[prop as keyof typeof expectedType]
            if (expectedPropType) {
              if (Array.isArray(propValue) && propValue.length === 1) {
                // If the expected type is a string and the value is an array with a single string, treat it as a single string
                if (typeof propValue[0] === 'string' && expectedPropType.includes(propValue[0])) {
                  // If the expected type is a string and the value is a string, check if the string is in the array
                } else if (typeof propValue[0] !== expectedPropType) {
                  errors.push(`Invalid ${variable}.${prop}: ${propValue[0]}. Expected type: ${expectedPropType}`)
                }
              } else if (Array.isArray(propValue)) {
                // If the expected type is an array and the value is an array, check if all elements in the array are of the expected type
                if (!propValue.every(item => expectedPropType.includes(item))) {
                  let expectedPropTypeString
                  if (Array.isArray(expectedPropType)) {
                    expectedPropTypeString = expectedPropType.join(', ')
                  } else {
                    expectedPropTypeString = expectedPropType
                  }
                  errors.push(`Invalid ${variable}.${prop}: ${propValue}. Expected type: ${expectedPropTypeString}`)
                }
              } else if (typeof propValue === 'string' && expectedPropType.includes(propValue)) {
                // If the expected type is an array and the value is a string, check if the string is in the array
              } else if (typeof propValue !== expectedPropType) {
                let expectedPropTypeString
                if (Array.isArray(expectedPropType)) {
                  expectedPropTypeString = expectedPropType.join(', ')
                } else {
                  expectedPropTypeString = expectedPropType
                }
                errors.push(`Invalid ${variable}.${prop}: ${propValue}. Expected type: ${expectedPropTypeString}`)
              }
            }
          }
        }
      } else if (Array.isArray(value)) {
        // If the value is an array, validate each item in the array
        value.forEach((item, index) => {
          if (typeof item !== expectedType) {
            errors.push(`Invalid ${variable}[${index}]: ${item}. Expected type: ${expectedType}`)
          }
        })
      } else if (typeof value !== expectedType) {
        errors.push(`Invalid ${variable}: ${value}. Expected type: ${expectedType}`)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }
}
