@implemented @vocabulary @games
Feature: Vocabulary mini-games
  A vocabulary pack only offers games that can be built completely from its
  words, so a learner never opens an empty or broken activity.

  Scenario: A rich vocabulary pack exposes all three mini-games
    Given a vocabulary pack with these French words:
      | word    |
      | château |
      | table   |
      | bateau  |
      | école   |
      | lecture |
      | route   |
      | lettre  |
      | terre   |
    When the playable vocabulary games are resolved
    Then the available games are "hangman, word-search, crossword"
