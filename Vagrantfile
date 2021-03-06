VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |node_config|

  node_config.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'"

  node_config.vm.box = "geerlingguy/ubuntu1604"

  node_config.vm.provision :shell, path: "setup/bootstrap.sh"
  node_config.vm.provision :shell, path: "setup/startup.sh", run: "always"

  node_config.vm.network :private_network, ip: "192.168.56.101"
  node_config.vm.network :forwarded_port, guest: 80, host: 9898

  node_config.vm.provider :virtualbox do |vb|
    vb.customize [
      "modifyvm", :id,
      "--name", "sma.in.monkii.com",
      "--natdnshostresolver1", "on",
      "--memory", "2048"
    ]
  end

  # Share project folder (where Vagrantfile is located) as /vagrant
  if RUBY_PLATFORM.include? "linux"
    node_config.vm.synced_folder ".", "/vagrant", nfs: true, :mount_options => ['vers=3,tcp']
  else
    node_config.vm.synced_folder ".", "/vagrant", nfs: true
  end

end
