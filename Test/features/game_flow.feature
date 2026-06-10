Feature: Game flow

  Scenario: Board appears after starting a game
    Given I access the game page
    When I set player 0 name to Ana
    And I set player 1 name to Bob
    And I remove extra players until only 2 remain
    And I click the Start game button
    Then I should see the game board

  Scenario: Current player can draw a card
    Given I access the game page
    When I set player 0 name to Ana
    And I set player 1 name to Bob
    And I remove extra players until only 2 remain
    And I click the Start game button
    Then the Draw card button should be enabled
    And the Stay button should be enabled

  Scenario: Player draws a card
    Given I access the game page
    When I set player 0 name to Ana
    And I set player 1 name to Bob
    And I remove extra players until only 2 remain
    And I click the Start game button
    And I click the Draw card button
    Then I should see the game board

  Scenario: Player stays
    Given I access the game page
    When I set player 0 name to Ana
    And I set player 1 name to Bob
    And I remove extra players until only 2 remain
    And I click the Start game button
    And I click the Stay button
    Then I should see the game board

  Scenario: Reset game goes back to home
    Given I access the game page
    When I set player 0 name to Ana
    And I set player 1 name to Bob
    And I remove extra players until only 2 remain
    And I click the Start game button
    And I click the Reset game button
    Then I should be on the home page

    Scenario: Player busts by drawing duplicate cards
      Given I access the game page
      When I set player 0 name to Ana
      And I set player 1 name to Bob
      And I remove extra players until only 2 remain
      And I click the Start game button
      And I draw cards until the player busts
      Then I should see the game board