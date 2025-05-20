import os
path = 'dataset'
arr={}
for label in os.listdir(path):
    label_path = os.path.join(path, label)
    arr[label]=len(os.listdir(label_path))
print(arr)
print(sum(arr.values()))