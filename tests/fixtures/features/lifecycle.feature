Feature: Lifecycle fixture
  @implemented
  Scenario Outline: Count executable examples
    Given example "<value>"

    Examples:
      | value |
      | one   |
      | two   |

  @implemented @planned
  Scenario: This conflicting scenario is invalid
    Given a future example

  @implemented
  Scenario: This implemented scenario is valid
    Given a current example

  @planned
  Scenario: Count a planned scenario
    Given a planned example
