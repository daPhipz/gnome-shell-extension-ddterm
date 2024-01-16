# -*- mode: ruby -*-
# vi: set ft=ruby :

# See docs/Vagrant.md

require 'open3'

CPUS = 4
MEMORY = 2048
SYNCED_FOLDER = '/home/vagrant/gnome-shell-extension-ddterm'
UUID = 'ddterm@amezin.github.com'
PACK_FILE_NAME = "#{UUID}.shell-extension.zip"

stdout, status = Open3.capture2('git', 'ls-files', '--exclude-standard', '-oi', '--directory')
if status.success?
  rsync_excludes = stdout.split(/\n/)
else
  rsync_excludes = []
end

Vagrant.configure("2") do |config|
  config.vm.provider 'libvirt' do |libvirt, override|
    libvirt.qemu_use_session = true
    libvirt.cpus = CPUS
    libvirt.memory = MEMORY
    libvirt.cputopology :sockets => '1', :cores => "#{CPUS}", :threads => '1'
  end

  config.vm.synced_folder '.', '/vagrant', disabled: true
  config.vm.synced_folder '.', SYNCED_FOLDER, type: 'rsync', rsync__exclude: rsync_excludes

  config.vm.provision 'copy',
    type: 'file',
    source: PACK_FILE_NAME,
    destination: '$HOME/',
    before: 'install',
    run: 'always'

  config.vm.provision 'install', type: 'shell', privileged: false, run: 'always', inline: <<-SCRIPT
    gnome-extensions install -f $HOME/#{PACK_FILE_NAME}
    gnome-extensions enable #{UUID}
  SCRIPT

  config.vm.provision 'reload', type: 'shell', run: 'always', after: 'install', inline: <<-SCRIPT
    loginctl terminate-user vagrant
  SCRIPT

  config.vm.define "fedora39", primary: true do |version|
    version.vm.box = "mezinalexander/fedora39"
  end

  config.vm.define "ubuntu2310", autostart: false do |version|
    version.vm.box = "mezinalexander/ubuntu2310"
  end

  config.vm.define "silverblue39", autostart: false do |version|
    version.vm.box = "mezinalexander/silverblue39"
  end

  config.vm.define "opensusetumbleweed", autostart: false do |version|
    version.vm.box = "mezinalexander/opensusetumbleweed"
  end

  config.vm.define "alpine319", autostart: false do |version|
    version.vm.box = "mezinalexander/alpine319"
    version.ssh.sudo_command = "doas -n -u root %c"

    version.vm.synced_folder '.', SYNCED_FOLDER,
      type: 'rsync',
      rsync__exclude: rsync_excludes,
      rsync__rsync_path: 'doas -u root rsync'
  end
end
