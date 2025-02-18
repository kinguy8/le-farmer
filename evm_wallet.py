from eth_account import Account
import csv
from mnemonic import Mnemonic

# Включаем поддержку создания кошельков
Account.enable_unaudited_hdwallet_features()

# Количество кошельков
num_wallets = 100

# Создаем список для хранения данных кошельков
wallets = []

mnemo = Mnemonic("english")

for i in range(num_wallets):
    mnemonic = mnemo.generate(strength=128)
    account = Account.create()
    print('account data = ', account)
    
    # Сохраняем данные кошелька
    wallets.append({
        'address': account.address,
        'private_key': account.key.hex(),
        'mnemonic': mnemonic
    })

# Сохраняем данные в CSV-файл
with open('wallets.csv', 'w', newline='') as csvfile:
    fieldnames = ['address', 'private_key', 'mnemonic']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    
    writer.writeheader()
    for wallet in wallets:
        writer.writerow(wallet)

print(f"Создано {num_wallets} кошельков. Данные сохранены в wallets.csv.")